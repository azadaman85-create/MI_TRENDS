"use client";

import Link from "next/link";
import { BadgeCheck, Heart, Sparkles, Truck } from "lucide-react";
import type { ReactNode } from "react";

import "./account.css";

const perks = [
  { icon: Sparkles, title: "First look at drops", copy: "Members get the restock and drop alerts before anyone else." },
  { icon: Heart, title: "Wishlist that follows you", copy: "Saved pieces stay put across every device you shop on." },
  { icon: Truck, title: "Checkout in two taps", copy: "Saved addresses mean no retyping when the drop lands." },
  { icon: BadgeCheck, title: "Order history and tracking", copy: "Every order, invoice and return in one place." },
];

export function AuthShell({
  eyebrow,
  title,
  lede,
  statement,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede: string;
  statement: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="acct">
      <aside className="acct__art">
        <div className="acct__art-media" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-oversized.jpg" alt="" />
        </div>

        <Link className="brand-lockup" href="/" aria-label="MI TRENDS home">
          <span className="brand-mark" aria-hidden="true" style={{ background: "#fff", color: "#171716" }}>
            MI
          </span>
          <span className="brand-name" style={{ color: "#fff" }}>
            TRENDS
          </span>
        </Link>

        <h2 className="acct__statement">{statement}</h2>

        <ul className="acct__perks">
          {perks.map((perk) => (
            <li key={perk.title}>
              <perk.icon size={17} aria-hidden="true" />
              <span>
                <strong>{perk.title}</strong>
                {perk.copy}
              </span>
            </li>
          ))}
        </ul>
      </aside>

      <section className="acct__panel">
        <div className="acct__card">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="acct__lede">{lede}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
