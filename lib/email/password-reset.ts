/**
 * Password-reset email. Same table-and-inline-styles approach as the order
 * confirmation — see lib/email/order-confirmation.ts for why.
 */

import { emailLogo } from "@/lib/email/brand";

const INK = "#171717";
const PAPER = "#fffdf9";
const LINE = "#ddd9d2";
const MUTED = "#716b64";

export const passwordResetSubject = "Reset your MI TRENDS password";

export function passwordResetText(name: string, resetUrl: string): string {
  return [
    `Hi ${name},`,
    ``,
    `We got a request to reset the password on your MI TRENDS account.`,
    ``,
    `Open this link to choose a new one:`,
    resetUrl,
    ``,
    `The link stops working in one hour, and can only be used once.`,
    ``,
    `If you didn't ask for this, you can ignore this email — your password stays as it is.`,
    ``,
    `MI TRENDS — Made to be noticed`,
  ].join("\n");
}

export function passwordResetHtml(name: string, resetUrl: string, siteUrl: string): string {
  const safeName = name.replace(/[<>&"]/g, "");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${passwordResetSubject}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Choose a new password — the link expires in an hour.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr><td align="center" style="padding:28px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;font-family:Arial,Helvetica,sans-serif;">

        <tr><td style="padding-bottom:22px;">${emailLogo(siteUrl)}</td></tr>

        <tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:12px;padding:30px 26px;">
          <div style="font-size:22px;font-weight:900;color:${INK};line-height:1.25;letter-spacing:-0.02em;">Reset your password</div>
          <div style="font-size:14px;color:${MUTED};line-height:1.65;padding-top:10px;">
            Hi ${safeName}, we got a request to reset the password on your MI TRENDS account.
            Choose a new one below.
          </div>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr><td style="background:${INK};border-radius:6px;">
              <a href="${resetUrl}" style="display:inline-block;padding:15px 30px;font-size:11px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                Choose a new password
              </a>
            </td></tr>
          </table>

          <div style="font-size:12px;color:${MUTED};line-height:1.7;padding-top:22px;">
            This link stops working in <strong style="color:${INK};">one hour</strong> and can only be used once.
          </div>
          <div style="font-size:12px;color:${MUTED};line-height:1.7;padding-top:14px;border-top:1px solid ${LINE};margin-top:18px;">
            Didn't ask for this? You can ignore this email — your password stays exactly as it is,
            and nobody can change it without this link.
          </div>

          <div style="font-size:11px;color:#a09a93;line-height:1.6;padding-top:18px;word-break:break-all;">
            Button not working? Paste this into your browser:<br />${resetUrl}
          </div>
        </td></tr>

        <tr><td style="padding:22px 6px;font-size:12px;color:${MUTED};line-height:1.7;">
          Need help? Reply to this email or visit <a href="${siteUrl}/info/contact" style="color:${INK};">our contact page</a>.
          <div style="padding-top:10px;color:#a09a93;">MI TRENDS — Made to be noticed</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
