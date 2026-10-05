"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, TriangleAlert } from "lucide-react";

import { AuthShell } from "@/components/account/AuthShell";

function strengthOf(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strength = strengthOf(password);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Both passwords need to match.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.message ?? "We couldn't reset your password. Please try again.");
      } else {
        // The API signs them in on this device, so land them in their account.
        router.push("/account");
      }
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthShell
        eyebrow="Account recovery"
        title="Link incomplete"
        lede="That reset link is missing its token."
        statement={
          <>
            Let&apos;s get you a <em>fresh</em> link.
          </>
        }
      >
        <p className="acct__alert" role="alert">
          <TriangleAlert size={16} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
          Open the link straight from the email, or request a new one.
        </p>
        <p className="acct__switch">
          <Link href="/account/forgot-password">Request a new reset link</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="New password"
      lede="Choose a new password for your account. You'll be signed in straight after."
      statement={
        <>
          Pick something <em>only you</em> would.
        </>
      }
    >
      {error && (
        <p className="acct__alert" role="alert">
          <TriangleAlert size={16} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
          {error}
        </p>
      )}

      <form className="acct__form" onSubmit={handleSubmit} noValidate>
        <div className="acct__field">
          <label htmlFor="password">New password</label>
          <div className="acct__input-wrap">
            <Lock size={16} aria-hidden="true" />
            <input
              id="password"
              className="acct__input"
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
            />
            <button
              className="acct__reveal"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>
          <span className="acct__hint" aria-live="polite">
            {password.length === 0
              ? "Mix letters, numbers and a symbol for a stronger password."
              : ["Too short", "Weak", "Fair", "Good", "Strong"][strength]}
          </span>
        </div>

        <div className="acct__field">
          <label htmlFor="confirm">Confirm new password</label>
          <div className="acct__input-wrap">
            <Lock size={16} aria-hidden="true" />
            <input
              id="confirm"
              className="acct__input"
              type={showPassword ? "text" : "password"}
              value={confirm}
              autoComplete="new-password"
              placeholder="Type it once more"
              onChange={(event) => {
                setConfirm(event.target.value);
                setError("");
              }}
            />
          </div>
        </div>

        <button className="acct__submit" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save new password"}
          {!submitting && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </form>

      <p className="acct__switch">
        Changed your mind? <Link href="/account/login">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
