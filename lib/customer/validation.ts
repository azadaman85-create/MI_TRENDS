/**
 * Server-side validation for customer account input. Mirrors the rules the signup form
 * already enforces in the browser — the client checks are for fast feedback, these are
 * the ones that actually decide what gets written to the database.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_MOBILE_PATTERN = /^[6-9][0-9]{9}$/;

export const MIN_PASSWORD_LENGTH = 8;
/** scrypt happily hashes megabytes; a cap keeps a huge body from burning CPU. */
export const MAX_PASSWORD_LENGTH = 200;
const MAX_NAME_LENGTH = 80;

export type ValidationError = { field: string; message: string };

export function validateSignUp(input: {
  name: unknown;
  email: unknown;
  password: unknown;
  phone: unknown;
}): { ok: true; value: { name: string; email: string; password: string; phone?: string } } | { ok: false; error: ValidationError } {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const phoneRaw = typeof input.phone === "string" ? input.phone.replace(/\D/g, "") : "";
  // The form sends a bare 10-digit number; tolerate a +91 prefix pasted in by hand.
  const phone = phoneRaw.length > 10 ? phoneRaw.slice(-10) : phoneRaw;

  if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: { field: "name", message: "Tell us what to call you." } };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: { field: "email", message: "Enter a valid email address." } };
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, error: { field: "password", message: "Use at least 8 characters." } };
  }
  if (phone && !INDIAN_MOBILE_PATTERN.test(phone)) {
    return { ok: false, error: { field: "phone", message: "Enter a valid 10-digit Indian mobile number." } };
  }

  return { ok: true, value: { name, email, password, phone: phone || undefined } };
}

export type OrderContact = {
  name: string;
  email: string;
  phone: string;
  address: { line1: string; area: string; city: string; state: string; pincode: string };
};

const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;

/**
 * Validates the delivery details submitted with an order. Same rules the checkout form
 * applies in the browser — repeated here because that's the copy that decides what the
 * database (and the courier) actually gets.
 */
export function validateOrderContact(input: unknown): { ok: true; value: OrderContact } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Add your delivery details." };
  const raw = input as Record<string, unknown>;
  const address = typeof raw.address === "object" && raw.address !== null ? (raw.address as Record<string, unknown>) : {};

  const str = (value: unknown, max = 120) => (typeof value === "string" ? value.trim().slice(0, max) : "");

  const name = str(raw.name, MAX_CONTACT_FIELD);
  const email = str(raw.email).toLowerCase();
  const phoneDigits = typeof raw.phone === "string" ? raw.phone.replace(/\D/g, "") : "";
  const phone = phoneDigits.length > 10 ? phoneDigits.slice(-10) : phoneDigits;
  const line1 = str(address.line1, MAX_CONTACT_FIELD);
  const area = str(address.area, MAX_CONTACT_FIELD);
  const city = str(address.city, MAX_CONTACT_FIELD);
  const state = str(address.state, MAX_CONTACT_FIELD);
  const pincode = str(address.pincode, 6);

  if (name.length < 2) return { ok: false, error: "Enter the name we should use for delivery." };
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (!INDIAN_MOBILE_PATTERN.test(phone)) return { ok: false, error: "Enter a valid 10-digit Indian mobile number." };
  if (line1.length < 8) return { ok: false, error: "Add a complete house, flat or building address." };
  if (area.length < 3) return { ok: false, error: "Add your road, area or locality." };
  if (city.length < 2) return { ok: false, error: "Enter your city." };
  if (!state) return { ok: false, error: "Choose your state." };
  if (!PINCODE_PATTERN.test(pincode)) return { ok: false, error: "Enter a valid 6-digit pincode." };

  return { ok: true, value: { name, email, phone, address: { line1, area, city, state, pincode } } };
}

const MAX_CONTACT_FIELD = 120;
