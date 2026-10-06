/**
 * Business details printed on invoices.
 *
 * Single place to edit. Anything left as an empty string is simply left off the invoice
 * rather than printed as a placeholder — an invoice is a commercial document, so a made-up
 * address or tax number on it is worse than no line at all.
 *
 * Fill in `address` and `gstin` with your real registered details before sending invoices
 * to customers.
 */
export const STORE_IDENTITY = {
  name: "MI TRENDS",
  tagline: "Made to be noticed",
  website: "mitrends.co.in",
  email: "mitrends2452@gmail.com",
  /** GSTIN, if you're registered. Left off the invoice when empty. */
  gstin: "",
  /** Phone for invoices and the shipping label's return block. */
  phone: "+91 6297 330 602",
  /**
   * Registered business / dispatch address. Kept as fields rather than one string
   * because the shipping label needs the city, state and pincode separately.
   * Everything printed from here is also where undelivered parcels come back to.
   */
  address: {
    line1: "Babupur",
    line2: "Tinpakuria, Samserganj",
    city: "Dhulian",
    state: "West Bengal",
    pincode: "742202",
  },
} as const;

/** True once there's enough of an address to print. */
export function hasStoreAddress(): boolean {
  const a = STORE_IDENTITY.address;
  return Boolean(a.line1 && a.city && a.state && a.pincode);
}

/** One-line address for the invoice; empty when unset, so the line is dropped entirely. */
export function storeAddressLine(): string {
  if (!hasStoreAddress()) return "";
  const a = STORE_IDENTITY.address;
  return [a.line1, a.line2, a.city, `${a.state} ${a.pincode}`].filter(Boolean).join(", ");
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n]!;
  const tail = n % 10;
  return TENS[Math.floor(n / 10)]! + (tail ? ` ${ONES[tail]}` : "");
}

/**
 * Rupees in words, Indian numbering (lakh/crore) — standard on invoices here.
 * Paise are ignored; every amount in this app is a whole rupee.
 */
export function amountInWords(amount: number): string {
  const value = Math.round(Math.abs(amount));
  if (value === 0) return "Zero Rupees Only";

  const crore = Math.floor(value / 10000000);
  const lakh = Math.floor((value % 10000000) / 100000);
  const thousand = Math.floor((value % 100000) / 1000);
  const hundred = Math.floor((value % 1000) / 100);
  const rest = value % 100;

  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));

  return `${parts.join(" ")} Rupees Only`;
}
