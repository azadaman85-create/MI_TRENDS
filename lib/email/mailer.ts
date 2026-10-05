import nodemailer, { type Transporter } from "nodemailer";

import type { OrderDoc } from "@/lib/db/models";
import { describeError, logSecurityEvent } from "@/lib/security/events";
import {
  orderConfirmationHtml,
  orderConfirmationSubject,
  orderConfirmationText,
} from "@/lib/email/order-confirmation";
import { passwordResetHtml, passwordResetSubject, passwordResetText } from "@/lib/email/password-reset";

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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mitrends.co.in";

export const EMAIL_CONFIGURED = Boolean(SMTP_USER && SMTP_PASSWORD);

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
      html: passwordResetHtml(name, resetUrl, SITE_URL),
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
      text: orderConfirmationText(order, SITE_URL),
      html: orderConfirmationHtml(order, SITE_URL),
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
