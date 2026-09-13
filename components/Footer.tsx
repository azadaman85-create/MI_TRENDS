"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUp } from "lucide-react";

import { useStore } from "@/components/StoreProvider";

const footerColumns = [
  {
    heading: "Shop",
    links: [
      { label: "Men", href: "/shop?category=men" },
      { label: "Women", href: "/shop?category=women" },
      { label: "New arrivals", href: "/shop?tag=new" },
      { label: "Pyjama sets", href: "/shop?type=pyjama-set" },
      { label: "Sale", href: "/shop?tag=sale" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Contact us", href: "/info/contact" },
      { label: "FAQs", href: "/info/faqs" },
      { label: "Shipping", href: "/info/shipping" },
      { label: "Returns", href: "/info/returns" },
      { label: "Size guide", href: "/info/size-guide" },
      { label: "Track order", href: "/info/track-order" },
    ],
  },
  {
    heading: "MI TRENDS",
    links: [
      { label: "Our story", href: "/info/about" },
      { label: "Stores", href: "/info/stores" },
      { label: "Careers", href: "/info/careers" },
      { label: "Press", href: "/info/press" },
      { label: "Gift cards", href: "/info/gift-cards" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms", href: "/info/terms" },
      { label: "Privacy", href: "/info/privacy" },
      { label: "Accessibility", href: "/info/accessibility" },
    ],
  },
];

export function Footer() {
  const { showToast } = useStore();
  const [email, setEmail] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 700);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const joinNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    showToast("You’re on the list. Fresh drops, no inbox clutter.");
    setEmail("");
  };

  return (
    <footer className="site-footer">
      <section className="newsletter-section" aria-labelledby="newsletter-title">
        <div className="newsletter-inner shell">
          <div className="newsletter-copy">
            <p className="eyebrow">The good stuff, first</p>
            <h2 id="newsletter-title">New drops. Rare offers. Your inbox.</h2>
            <p>
              A short note when there is something genuinely worth wearing.
            </p>
          </div>
          <form className="newsletter-form" onSubmit={joinNewsletter}>
            <label className="sr-only" htmlFor="footer-newsletter-email">
              Email address
            </label>
            <input
              id="footer-newsletter-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <button className="button button-primary" type="submit">
              Join the list
              <ArrowRight aria-hidden="true" size={17} />
            </button>
          </form>
        </div>
      </section>

      <div className="footer-main shell">
        <div className="footer-brand-column">
          <Link className="brand-lockup footer-brand" href="/" aria-label="MI TRENDS home">
            <span className="brand-mark" aria-hidden="true">
              MI
            </span>
            <span className="brand-name">TRENDS</span>
          </Link>
          <p>
            Original graphics and easygoing essentials, designed in India for
            people who dress like themselves.
          </p>
          <div className="social-links" aria-label="MI TRENDS social channels">
            <a
              className="icon-button"
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="MI TRENDS on Instagram"
            >
              <span aria-hidden="true">IG</span>
            </a>
            <a
              className="icon-button"
              href="https://www.youtube.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="MI TRENDS on YouTube"
            >
              <span aria-hidden="true">YT</span>
            </a>
            <a
              className="icon-button"
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="MI TRENDS on LinkedIn"
            >
              <span aria-hidden="true">in</span>
            </a>
          </div>
        </div>

        <nav className="footer-navigation" aria-label="Footer navigation">
          {footerColumns.map((column) => (
            <div className="footer-link-column" key={column.heading}>
              <h2>{column.heading}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="footer-confidence shell">
        <div>
          <span className="footer-small-heading">Pay your way</span>
          <div className="payment-method-list" aria-label="Accepted payment methods">
            <span>UPI</span>
            <span>Visa</span>
            <span>Mastercard</span>
            <span>RuPay</span>
            <span>COD</span>
          </div>
        </div>
        <p>
          Secure checkout <span aria-hidden="true">·</span> 30-day returns{" "}
          <span aria-hidden="true">·</span> Human support
        </p>
      </div>

      <div className="footer-legal shell">
        <p>
          © {new Date().getFullYear()} MI TRENDS. Built for original expression.
        </p>
        <p>Made with care in India.</p>
      </div>

      {showBackToTop && (
        <button
          className="back-to-top"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          <ArrowUp aria-hidden="true" size={19} />
        </button>
      )}
    </footer>
  );
}

export default Footer;
