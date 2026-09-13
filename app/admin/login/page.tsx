"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Field";
import { useAdminAuth } from "@/lib/admin/auth";
import { shakeAnimation, smooth, spring } from "@/lib/admin/motion";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, user, ready } = useAdminAuth();
  const cardControls = useAnimationControls();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/admin");
  }, [ready, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const errors: typeof fieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter the email on your admin account.";
    if (password.length < 6) errors.password = "Passwords are at least 6 characters.";
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      cardControls.start(shakeAnimation);
      return;
    }

    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message ?? "Sign in failed.");
      cardControls.start(shakeAnimation);
      return;
    }

    setSuccess(true);
    // Let the success state play before handing over to the dashboard.
    setTimeout(() => router.replace("/admin"), 520);
  };

  return (
    <div className="admin-login">
      <motion.aside
        className="admin-login__art"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="admin-login__art-media" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-afterdark.jpg" alt="" />
        </div>
        <motion.span
          className="admin-login__blob"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0, 1] }}
        />

        <motion.div
          className="admin-login__mark"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...smooth, delay: 0.1 }}
        >
          <span className="admin-brand-mark" aria-hidden="true">
            MI
          </span>
          <span className="admin-brand-copy">
            <span className="admin-brand-name">TRENDS</span>
            <span className="admin-brand-role">Control room</span>
          </span>
        </motion.div>

        <div>
          <motion.p
            className="a-eyebrow"
            style={{ color: "var(--yellow)" }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smooth, delay: 0.18 }}
          >
            Admin access · Drop 01
          </motion.p>
          <motion.h2
            className="admin-login__statement"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smooth, delay: 0.24 }}
          >
            Run the <em>drop</em> from here.
          </motion.h2>
          <motion.p
            className="admin-login__lede"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smooth, delay: 0.32 }}
          >
            Products, stock, orders and campaigns for the MI TRENDS storefront — one workspace, same
            design language as the shop your customers see.
          </motion.p>
        </div>

        <motion.div
          className="admin-login__stats"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...smooth, delay: 0.4 }}
        >
          <div className="admin-login__stat">
            <strong>72</strong>
            <span>Live products</span>
          </div>
          <div className="admin-login__stat">
            <strong>8</strong>
            <span>Collections</span>
          </div>
          <div className="admin-login__stat">
            <strong>184</strong>
            <span>Orders this quarter</span>
          </div>
        </motion.div>
      </motion.aside>

      <section className="admin-login__panel">
        <motion.div
          className="admin-login__card"
          animate={cardControls}
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={spring}
        >
          <p className="a-eyebrow">MI TRENDS Admin</p>
          <h1>Sign in to the panel</h1>
          <p>Use your store credentials. Sessions stay on this device only.</p>

          <AnimatePresence>
            {formError ? (
              <motion.div
                className="admin-login__alert"
                role="alert"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TriangleAlert size={16} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
                <span>{formError}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
            <Input
              label="Admin email"
              type="email"
              name="email"
              value={email}
              autoComplete="username"
              placeholder="you@mitrends.in"
              error={fieldErrors.email}
              leading={<Mail size={15} aria-hidden="true" />}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              autoComplete="current-password"
              placeholder="••••••••"
              error={fieldErrors.password}
              leading={<Lock size={15} aria-hidden="true" />}
              trailing={
                <button
                  className="a-input-icon__trailing"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              }
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
            />

            <div className="admin-login__row">
              <label className="a-switch" style={{ fontSize: "0.76rem" }}>
                <input type="checkbox" name="remember" defaultChecked />
                <span className="a-switch__track" aria-hidden="true" />
                <span>Keep me signed in</span>
              </label>
              <a className="a-micro" href="mailto:support@mitrends.in?subject=Admin%20password%20reset" style={{ color: "var(--red)" }}>
                Forgot password?
              </a>
            </div>

            <Button type="submit" size="lg" full loading={submitting} disabled={success}>
              {success ? "Signed in" : submitting ? "Signing in" : "Sign in"}
              {!submitting && !success ? <ArrowRight size={16} aria-hidden="true" /> : null}
            </Button>
          </form>

          <p className="admin-login__foot" style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <ShieldCheck size={14} aria-hidden="true" />
            Protected area. Activity on this panel is attributed to your account.
          </p>
        </motion.div>
      </section>

      <AnimatePresence>
        {success ? (
          <motion.div
            key="handoff"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 90,
              display: "grid",
              placeItems: "center",
              background: "var(--nav)",
              color: "#fff",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring}
              style={{ display: "grid", justifyItems: "center", gap: 12 }}
            >
              <span className="admin-brand-mark" aria-hidden="true">
                MI
              </span>
              <span className="a-micro" style={{ color: "rgb(255 255 255 / 0.6)" }}>
                Opening your dashboard…
              </span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
