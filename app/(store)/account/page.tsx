"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, LogOut, MapPin, Package, ShieldCheck, ShoppingBag } from "lucide-react";

import "@/components/account/account.css";
import { initialsOf, useCustomer } from "@/lib/account/auth";
import { useStore } from "@/components/StoreProvider";

const links = [
  {
    href: "/wishlist",
    icon: Heart,
    title: "Wishlist",
    copy: "Everything you've saved for the next drop.",
  },
  {
    href: "/info/track-order",
    icon: Package,
    title: "Track an order",
    copy: "Follow a parcel from packing to your door.",
  },
  {
    href: "/info/returns",
    icon: ShieldCheck,
    title: "Returns & refunds",
    copy: "30-day returns on everything, no questions.",
  },
  {
    href: "/cart",
    icon: ShoppingBag,
    title: "Your bag",
    copy: "Pick up where you left off.",
  },
];

export default function AccountPage() {
  const router = useRouter();
  const { customer, ready, signOut } = useCustomer();
  const { wishlistCount, cartCount } = useStore();

  useEffect(() => {
    if (ready && !customer) router.replace("/account/login?next=/account");
  }, [ready, customer, router]);

  if (!ready || !customer) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "#77716a" }}>
        <span className="eyebrow">{ready ? "Taking you to sign in…" : "Loading your account…"}</span>
      </div>
    );
  }

  const joined = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(customer.createdAt));

  return (
    <div className="acct-home">
      <header className="acct-home__head">
        <div>
          <p className="eyebrow">Your account</p>
          <h1>Hey, {customer.name.split(" ")[0]}</h1>
        </div>

        <div className="acct-home__identity">
          <span className="acct-avatar" aria-hidden="true">
            {customer.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={customer.picture} alt="" referrerPolicy="no-referrer" />
            ) : (
              initialsOf(customer.name, customer.email)
            )}
          </span>
          <button className="acct-signout" type="button" onClick={signOut}>
            <LogOut size={15} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <div className="acct-home__grid">
        {links.map((link) => (
          <Link className="acct-card" href={link.href} key={link.href}>
            <span className="acct-card__icon">
              <link.icon size={18} aria-hidden="true" />
            </span>
            <strong>
              {link.title}
              {link.href === "/wishlist" && wishlistCount > 0 ? ` · ${wishlistCount}` : ""}
              {link.href === "/cart" && cartCount > 0 ? ` · ${cartCount}` : ""}
            </strong>
            <span>{link.copy}</span>
          </Link>
        ))}
      </div>

      <section className="acct-home__detail">
        <h2 style={{ margin: 0, fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Account details
        </h2>
        <dl>
          <div>
            <dt>Name</dt>
            <dd>{customer.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{customer.email}</dd>
          </div>
          {customer.phone && (
            <div>
              <dt>Mobile</dt>
              <dd>{customer.phone}</dd>
            </div>
          )}
          <div>
            <dt>Signed in with</dt>
            <dd>{customer.provider === "google" ? "Google" : "Email and password"}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{joined}</dd>
          </div>
        </dl>

        <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 0", color: "#7a746d", fontSize: "0.78rem" }}>
          <MapPin size={14} aria-hidden="true" />
          Saved addresses arrive with the next release — checkout still remembers what you type.
        </p>
      </section>
    </div>
  );
}
