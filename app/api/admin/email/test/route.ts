import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard.server";
import { emailLogo } from "@/lib/email/brand";
import { sendRawEmail, smtpStatus } from "@/lib/email/mailer";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";
import { siteUrl } from "@/lib/site";

const ENDPOINT = "/api/admin/email/test";

/** GET reports whether SMTP is configured, without sending anything. */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401, headers: { "x-request-id": requestId } });
  }
  return NextResponse.json(smtpStatus(), { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } });
}

/**
 * Sends a test email to the admin address and reports what actually happened.
 *
 * Order confirmations are best-effort by design — an order must never fail because the
 * mail server did — which means a misconfigured mailbox fails silently and you only
 * find out when a customer says they got nothing. This is the deliberate way to find
 * out, and it returns the real SMTP error rather than a generic failure, because the
 * difference between "wrong App Password" and "2-Step Verification is off" is the whole
 * diagnosis.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  // Tight limit: each call sends a real email.
  if (!consumeRateLimit(`email-test:${ip}`, 5, 10 * 60 * 1000).ok) {
    return NextResponse.json(
      { ok: false, error: "Too many test emails. Try again in a few minutes." },
      { status: 429, headers: { "x-request-id": requestId } },
    );
  }

  const admin = await requireAdmin();
  if (!admin) {
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "no-admin-session" } });
    return NextResponse.json({ error: "Not authorized." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  const status = smtpStatus();
  if (!status.configured) {
    return NextResponse.json(
      { ok: false, error: status.missing.length
          ? `Not configured: ${status.missing.join(" and ")} ${status.missing.length === 1 ? "is" : "are"} missing on this deployment.`
          : "Email is not configured." },
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  // Sent to the admin's own address: a test that mails a stranger is not a test.
  const result = await sendRawEmail({
    to: admin.email,
    subject: "MI TRENDS — email is working",
    text: `This is a test from your MI TRENDS admin panel.\n\nIf you are reading this, order confirmations, password resets and return updates will send.\n\n${siteUrl()}`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#fffdf9;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:520px;margin:0 auto;">
        ${emailLogo(siteUrl())}
        <div style="margin-top:22px;padding:26px;background:#fff;border:1px solid #ddd9d2;border-radius:12px;">
          <div style="font-size:20px;font-weight:900;color:#171717;">Email is working</div>
          <p style="font-size:14px;color:#716b64;line-height:1.65;">
            This test was sent from your admin panel. Order confirmations, password resets
            and return updates will reach customers.
          </p>
          <p style="font-size:12px;color:#a09a93;margin-top:18px;">Sent ${new Date().toLocaleString("en-IN")}</p>
        </div>
      </div>
    </body></html>`,
  });

  logSecurityEvent({ type: "ADMIN_ACTION", requestId, ip, endpoint: ENDPOINT, result: result.ok ? "allowed" : "error", risk: "low", meta: { action: "email-test", ok: result.ok, admin: admin.email } });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, hint: hintFor(result.error) },
      { status: 502, headers: { "x-request-id": requestId } },
    );
  }
  return NextResponse.json({ ok: true, sentTo: admin.email }, { headers: { "x-request-id": requestId } });
}

/** Turns the common Gmail SMTP failures into the thing you actually need to change. */
function hintFor(error: string): string {
  const text = error.toLowerCase();
  if (text.includes("535") || text.includes("username and password not accepted")) {
    return "Gmail rejected the credentials. SMTP_PASSWORD must be a 16-character App Password with the spaces removed — not the Gmail account password. App Passwords only exist once 2-Step Verification is on.";
  }
  if (text.includes("534") || text.includes("application-specific")) {
    return "This account requires an App Password. Turn on 2-Step Verification, then create one at myaccount.google.com/apppasswords.";
  }
  if (text.includes("timeout") || text.includes("etimedout") || text.includes("econn")) {
    return "Could not reach Gmail's SMTP server. Usually transient — try again in a minute.";
  }
  return "Check SMTP_USER and SMTP_PASSWORD on the Production environment in Vercel, then redeploy.";
}
