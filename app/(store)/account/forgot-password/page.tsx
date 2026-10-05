"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Mail, MailCheck, TriangleAlert } from "lucide-react";

import { AuthShell } from "@/components/account/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.message ?? "We couldn't start the reset. Please try again.");
      else setSent(true);
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset password"
      lede="Tell us the email on your account and we'll send a link to set a new password."
      statement={
        <>
          Back in, <em>in a minute</em>.
        </>
      }
    >
      {sent ? (
        <>
          <p className="acct__alert" role="status" style={{ background: "#eef7f1", color: "#1b6b3e", borderColor: "#cfe8d6" }}>
            <MailCheck size={16} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
            If that email has an account, a reset link is on its way. It works for one hour and
            can only be used once.
          </p>
          <p className="acct__switch">
            Nothing after a few minutes? Check spam, or{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              style={{ border: 0, background: "none", padding: 0, font: "inherit", color: "inherit", textDecoration: "underline", cursor: "pointer" }}
            >
              try another email
            </button>
            .
          </p>
          <p className="acct__switch">
            <Link href="/account/login">Back to sign in</Link>
          </p>
        </>
      ) : (
        <>
          {error && (
            <p className="acct__alert" role="alert">
              <TriangleAlert size={16} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
              {error}
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
                  aria-invalid={error ? true : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                />
              </div>
            </div>

            <button className="acct__submit" type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send reset link"}
              {!submitting && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </form>

          <p className="acct__switch">
            Remembered it? <Link href="/account/login">Sign in</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
