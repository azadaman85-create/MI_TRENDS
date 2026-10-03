import Razorpay from "razorpay";

/** Server-only client. Importing this from a "use client" file would leak the key secret into the bundle. */
export function razorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error("Razorpay keys are not configured.");
  return new Razorpay({ key_id, key_secret });
}
