"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, TriangleAlert, UserRound } from "lucide-react";

import { AuthShell } from "@/components/account/AuthShell";
import { GoogleAuthButton } from "@/components/account/GoogleAuthButton";
import { useCustomer } from "@/lib/account/auth";

function strengthOf(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useCustomer();

  const next = searchParams.get("next") || "/account";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = strengthOf(password);
  const strengthLabel = ["Too short", "Weak", "Fair", "Strong", "Very strong"][strength];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors: typeof errors = {};
    if (name.trim().length < 2) nextErrors.name = "Tell us what to call you.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!/^[6-9][0-9]{9}$/.test(phone)) nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    if (password.length < 8) nextErrors.password = "Use at least 8 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    const result = await signUp({ name, email, password, phone: `+91 ${phone}` });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    router.push(next);
  };

  return (
    <AuthShell
      eyebrow="Join the list"
      title="Create account"
      lede="One account for your wishlist, orders and early access to every drop."
      statement={
        <>
          Made to be <em>noticed</em>.
        </>
      }
    >
      {formError && (
        <p className="acct__alert" role="alert">
          <TriangleAlert size={16} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
          {formError}
        </p>
      )}

      <form className="acct__form" onSubmit={handleSubmit} noValidate>
        <div className="acct__field">
          <label htmlFor="name">Full name</label>
          <div className="acct__input-wrap">
            <UserRound size={16} aria-hidden="true" />
            <input
              id="name"
              className="acct__input"
              name="name"
              value={name}
              autoComplete="name"
              placeholder="Enter your full name"
              aria-invalid={errors.name ? true : undefined}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
            />
          </div>
          {errors.name && <span className="acct__error">{errors.name}</span>}
        </div>

        <div className="acct__field">
          <label htmlFor="email">Email</label>
          <div className="acct__input-wrap">
            <Mail size={16} aria-hidden="true" />
            <input
              id="email"
              className="acct__input"
              type="email"
              name="email"
              value={email}
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
            />
          </div>
          {errors.email && <span className="acct__error">{errors.email}</span>}
        </div>

        <div className="acct__field">
          <label htmlFor="phone">Mobile number</label>
          <div className="acct__input-wrap acct__input-wrap--prefixed">
            <Phone size={16} aria-hidden="true" />
            <span className="acct__prefix" aria-hidden="true">
              +91
            </span>
            <input
              id="phone"
              className="acct__input acct__input--prefixed"
              type="tel"
              name="phone"
              value={phone}
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              placeholder="Enter your mobile number"
              aria-describedby="phone-help"
              aria-invalid={errors.phone ? true : undefined}
              onChange={(event) => {
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                setErrors((current) => ({ ...current, phone: undefined }));
              }}
            />
          </div>
          {errors.phone ? (
            <span className="acct__error">{errors.phone}</span>
          ) : (
            <span className="acct__hint" id="phone-help">
              We only use this for delivery and order updates.
            </span>
          )}
        </div>

        <div className="acct__field">
          <label htmlFor="password">Password</label>
          <div className="acct__input-wrap">
            <Lock size={16} aria-hidden="true" />
            <input
              id="password"
              className="acct__input"
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={errors.password ? true : undefined}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
            />
            <button
              className="acct__reveal"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
          {errors.password ? (
            <span className="acct__error">{errors.password}</span>
          ) : (
            <span className="acct__hint" aria-live="polite">
              {password ? `Password strength: ${strengthLabel}` : "Use 8+ characters with a number or symbol."}
            </span>
          )}
        </div>

        <button className="acct__submit" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
          {!submitting && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </form>

      <div className="acct__divider">or</div>

      <GoogleAuthButton
        mode="signup_with"
        onSuccess={() => router.push(next)}
        onError={(message) => setFormError(message)}
      />

      <p className="acct__switch">
        Already have an account?{" "}
        <Link href={next === "/account" ? "/account/login" : `/account/login?next=${encodeURIComponent(next)}`}>
          Sign in
        </Link>
      </p>

      <p className="acct__legal">
        By creating an account you agree to our <Link href="/info/terms">terms</Link> and{" "}
        <Link href="/info/privacy">privacy policy</Link>.
      </p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <SignupContent />
    </Suspense>
  );
}
