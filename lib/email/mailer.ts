import nodemailer, { type Transporter } from "nodemailer";

import type { OrderDoc } from "@/lib/db/models";
import { describeError, logSecurityEvent } from "@/lib/security/events";
import {
  orderConfirmationHtml,
  orderConfirmationSubject,
  orderConfirmationText,
} from "@/lib/email/order-confirmation";
import { passwordResetHtml, passwordResetSubject, passwordResetText } from "@/lib/email/password-reset";
import { siteUrl } from "@/lib/site";

/**
 * Transactional email over Gmail SMTP.
 *
 * Gmail needs an **App Password**, not the account password — see SETUP.md. Sending is
 * always best-effort: an order must never fail because the mail server was slow or
 * misconfigured, so every caller treats a failed send as a logged warning, not an error.
 */

const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? "";
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "MI TRENDS";


export const EMAIL_CONFIGURED = Boolean(SMTP_USER && SMTP_PASSWORD);

/**
 * Which pieces of the mail configuration are present.
 *
 * Read from process.env on each call rather than from the constants above, so it
 * reports what the running deployment actually has rather than what was true when this
 * module was first loaded. Never returns the password — only whether there is one.
 */
export function smtpStatus(): { configured: boolean; user: string; missing: string[] } {
  const user = process.env.SMTP_USER ?? "";
  const password = process.env.SMTP_PASSWORD ?? "";
  const missing: string[] = [];
  if (!user) missing.push("SMTP_USER");
  if (!password) missing.push("SMTP_PASSWORD");
  return { configured: missing.length === 0, user, missing };
}

/**
 * Sends one message and reports the real failure.
 *
 * The transactional senders below swallow errors on purpose — an order must not fail
 * because the mail server did. This is the deliberate exception, used by the admin test
 * endpoint, where the error message is the entire point.
 */
export async function sendRawEmail(message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!smtpStatus().configured) return { ok: false, error: "SMTP is not configured." };
  try {
    await getTransporter().sendMail({
      from: `"${MAIL_FROM_NAME}" <${SMTP_USER}>`,
      replyTo: SMTP_USER,
      ...message,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      // A hung SMTP handshake shouldn't hold a serverless invocation open.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

/**
 * Sends a password-reset link. Unlike the order confirmation, the caller does care
 * whether this worked — a shopper who gets "check your inbox" and no email is stuck —
 * but the API still answers identically either way so it can't be used to probe which
 * addresses have accounts.
 */
export async function sendPasswordReset(
  to: string,
  name: string,
  resetUrl: string,
  requestId?: string,
): Promise<boolean> {
  if (!EMAIL_CONFIGURED) {
    logSecurityEvent({
      type: "SUSPICIOUS_REQUEST",
      requestId,
      endpoint: "email/password-reset",
      result: "error",
      risk: "medium",
      meta: { cause: "SMTP_USER/SMTP_PASSWORD not configured" },
    });
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: `"${MAIL_FROM_NAME}" <${SMTP_USER}>`,
      to,
      replyTo: SMTP_USER,
      subject: passwordResetSubject,
      text: passwordResetText(name, resetUrl),
      html: passwordResetHtml(name, resetUrl, siteUrl()),
    });
    return true;
  } catch (error) {
    logSecurityEvent({
      type: "SUSPICIOUS_REQUEST",
      requestId,
      endpoint: "email/password-reset",
      result: "error",
      risk: "medium",
      meta: { cause: describeError(error) },
    });
    return false;
  }
}

/**
 * Sends the order confirmation. Returns whether it went out — callers log the result but
 * never surface it to the shopper, whose order is already placed either way.
 */
export async function sendOrderConfirmation(order: OrderDoc, requestId?: string): Promise<boolean> {
  if (!EMAIL_CONFIGURED) {
    logSecurityEvent({
      type: "SUSPICIOUS_REQUEST",
      requestId,
      endpoint: "email/order-confirmation",
      result: "error",
      risk: "low",
      meta: { order: order._id, cause: "SMTP_USER/SMTP_PASSWORD not configured" },
    });
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: `"${MAIL_FROM_NAME}" <${SMTP_USER}>`,
      to: order.email,
      // Replies go to the shop's own inbox, which is the same account here.
      replyTo: SMTP_USER,
      subject: orderConfirmationSubject(order),
      text: orderConfirmationText(order, siteUrl()),
      html: orderConfirmationHtml(order, siteUrl()),
    });

    logSecurityEvent({
      type: "ADMIN_ACTION",
      requestId,
      endpoint: "email/order-confirmation",
      result: "allowed",
      risk: "low",
      meta: { action: "order-confirmation-sent", order: order._id },
    });
    return true;
  } catch (error) {
    logSecurityEvent({
      type: "SUSPICIOUS_REQUEST",
      requestId,
      endpoint: "email/order-confirmation",
      result: "error",
      risk: "low",
      meta: { order: order._id, cause: describeError(error) },
    });
    return false;
  }
}
