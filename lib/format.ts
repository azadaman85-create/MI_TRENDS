const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const FREE_SHIPPING_THRESHOLD = 999;
export const STANDARD_SHIPPING = 79;
export const COD_FEE = 49;

export function formatINR(amount: number) {
  return inrFormatter.format(Math.round(amount));
}

export const formatPrice = formatINR;
export const formatCurrency = formatINR;
export const formatInr = formatINR;
export const money = formatINR;

export function formatCompactNumber(value: number) {
  return compactNumberFormatter.format(value);
}

export function getSavings(mrp: number, price: number) {
  return Math.max(0, mrp - price);
}

export function getDiscountPercent(mrp: number, price: number) {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function amountUntilFreeShipping(subtotal: number) {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}

export function formatDeliveryDate(date: Date, includeWeekday = true) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: includeWeekday ? "short" : undefined,
    day: "numeric",
    month: "short",
  }).format(date);
}

export function getDeliveryDate(daysFromNow = 5, from = new Date()) {
  const deliveryDate = new Date(from);
  deliveryDate.setHours(12, 0, 0, 0);
  deliveryDate.setDate(deliveryDate.getDate() + daysFromNow);
  return deliveryDate;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
