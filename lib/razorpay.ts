import Razorpay from "razorpay";

/**
 * Razorpay mode is decided entirely by the key prefix — `rzp_test_` or `rzp_live_`.
 * There is no separate mode flag, so the keys in the environment *are* the setting.
 */
export function razorpayKeyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
}

export function isTestKey(keyId: string): boolean {
  return keyId.startsWith("rzp_test_");
}

/**
 * Test keys on the real site would be worse than no payments at all: the Razorpay
 * modal would accept test cards, no money would move, and the order would still be
 * written as paid — i.e. anyone could check out for free. Refuse to start rather than
 * take that order.
 *
 * Scoped to `VERCEL_ENV === "production"` (the live domain) on purpose, so preview
 * deploys and local development keep working on test keys.
 */
function assertKeyMatchesEnvironment(keyId: string) {
  if (process.env.VERCEL_ENV === "production" && isTestKey(keyId)) {
    throw new Error(
      "Refusing to use Razorpay TEST keys in production. Set NEXT_PUBLIC_RAZORPAY_KEY_ID " +
        "and RAZORPAY_KEY_SECRET to the live (rzp_live_) pair and redeploy.",
    );
  }

  // The mirror image: live keys outside production. Allowed, because the test keys have
  // been retired and these are the only ones left — but it means a checkout on localhost
  // moves real money and needs a real refund, so it must not happen quietly.
  if (process.env.VERCEL_ENV !== "production" && !isTestKey(keyId)) {
    console.warn(
      "\n*** Razorpay LIVE keys are active outside production. ***\n" +
        "*** Any checkout from here charges real money and must be refunded by hand. ***\n",
    );
  }
}

/** Server-only client. Importing this from a "use client" file would leak the key secret into the bundle. */
export function razorpayClient() {
  const key_id = razorpayKeyId();
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error("Razorpay keys are not configured.");
  assertKeyMatchesEnvironment(key_id);
  return new Razorpay({ key_id, key_secret });
}
