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
  /** Registered business address — fill this in. */
  address: "",
  /** GSTIN, if you're registered. Left off the invoice when empty. */
  gstin: "",
  /** Phone shown on the invoice, if you want one there. */
  phone: "",
} as const;

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
