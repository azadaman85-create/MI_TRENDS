"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, TriangleAlert } from "lucide-react";

import { AuthShell } from "@/components/account/AuthShell";
import { GoogleAuthButton } from "@/components/account/GoogleAuthButton";
import { useCustomer } from "@/lib/account/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useCustomer();

  const next = searchParams.get("next") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    router.push(next);
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      lede="Your bag, wishlist and orders — right where you left them."
      statement={
        <>
          Drops hit <em>your</em> inbox first.
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
          <label htmlFor="password">Password</label>
          <div className="acct__input-wrap">
            <Lock size={16} aria-hidden="true" />
            <input
              id="password"
              className="acct__input"
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              autoComplete="current-password"
              placeholder="••••••••"
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
          {errors.password && <span className="acct__error">{errors.password}</span>}
        </div>

        <div className="acct__row">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" name="remember" defaultChecked style={{ accentColor: "#171717", width: 16, height: 16 }} />
            Keep me signed in
          </label>
          <a href="mailto:hello@mitrends.in?subject=Password%20reset">Forgot password?</a>
        </div>

        <button className="acct__submit" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
          {!submitting && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </form>

      <div className="acct__divider">or</div>

      <GoogleAuthButton
        mode="signin_with"
        onSuccess={() => router.push(next)}
        onError={(message) => setFormError(message)}
      />

      <p className="acct__switch">
        New to MI TRENDS?{" "}
        <Link href={next === "/account" ? "/account/signup" : `/account/signup?next=${encodeURIComponent(next)}`}>
          Create an account
        </Link>
      </p>

      <p className="acct__legal">
        An account is needed to place an order — it keeps your bag, delivery details and
        order history together.
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <LoginContent />
    </Suspense>
  );
}
