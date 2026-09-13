"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Mail,
  Package,
  Phone,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
} from "lucide-react";
import { useStore } from "@/components/StoreProvider";

type Section = { heading: string; body: string[] };
type PageContent = { eyebrow: string; title: string; intro: string; sections: Section[] };

const SIMPLE_PAGES: Record<string, PageContent> = {
  about: {
    eyebrow: "Our story",
    title: "MADE TO BE\nNOTICED.",
    intro: "MI TRENDS started as a small print run for friends who wanted graphics no one else was wearing. It grew into a full wardrobe.",
    sections: [
      { heading: "Where we started", body: ["We design every graphic, fit and colourway in-house, then run small batches so drops stay original instead of everywhere at once.", "No two seasons repeat a print. If a design sells out, it stays retired — that's the point of a drop, not a restock."] },
      { heading: "How we make it", body: ["Heavyweight cotton, proper stitching and washes that hold their shape after the twentieth wear are non-negotiable, even on our lowest-priced pieces.", "We work with small manufacturing partners across India and keep runs tight, which also means less leftover stock going to waste."] },
      { heading: "What's next", body: ["More drops, better fits, and eventually stores you can walk into. Join the newsletter at the bottom of the page and you'll hear about all of it first."] },
    ],
  },
  careers: {
    eyebrow: "Join the team",
    title: "BUILD THE\nBRAND WITH US.",
    intro: "We're a small, fast-moving team based in India. We hire for craft over titles.",
    sections: [
      { heading: "Open roles", body: ["Graphic Designer — Streetwear prints", "Customer Experience Associate", "Retail Operations Lead (upcoming stores)", "We update this list as roles open, so check back or send a general application anytime."] },
      { heading: "How to apply", body: ["Email your resume and portfolio (if relevant) to careers@mitrends.in with the role in the subject line. We reply to every genuine application within two weeks."] },
    ],
  },
  press: {
    eyebrow: "Press & media",
    title: "LET'S TELL\nTHE STORY.",
    intro: "For interviews, product seeding, or brand assets, reach our press desk directly.",
    sections: [
      { heading: "Media contact", body: ["Email press@mitrends.in with your publication, deadline and what you need. We usually respond within 2 business days."] },
      { heading: "Brand assets", body: ["Logo files, product photography and founder bios are available on request — just mention it in your email and we'll send a press kit."] },
    ],
  },
  "gift-cards": {
    eyebrow: "Coming soon",
    title: "GIFT THE\nWHOLE WARDROBE.",
    intro: "Digital gift cards are launching soon, redeemable on any style, any size, any drop.",
    sections: [
      { heading: "How they'll work", body: ["Buy a gift card in any amount, delivered by email instantly. The recipient applies the code at checkout — no expiry, no fine print."] },
    ],
  },
  stores: {
    eyebrow: "Offline, soon",
    title: "WE'RE ONLINE\nFOR NOW.",
    intro: "MI TRENDS is currently a direct-to-you online store while we plan our first physical space.",
    sections: [
      { heading: "First store", body: ["We're scouting locations in major Indian cities. Tell us where you'd like to see us first using the form below and we'll factor it into the plan."] },
    ],
  },
  shipping: {
    eyebrow: "Delivery info",
    title: "GETTING IT\nTO YOU.",
    intro: "Here's exactly what to expect after you place an order.",
    sections: [
      { heading: "Delivery timelines", body: ["Metro cities: 3-5 business days.", "Rest of India: 5-7 business days.", "Remote pin codes may take a little longer — we'll flag this at checkout if it applies to you."] },
      { heading: "Shipping charges", body: ["Free shipping on orders of ₹999 and above.", "A flat ₹79 fee applies on smaller orders.", "Cash on delivery orders carry an additional ₹49 handling fee."] },
      { heading: "Tracking your order", body: ["Once your order ships, you'll get an SMS and email with tracking details. You can also check status anytime on our Track order page."] },
      { heading: "Delays", body: ["Festive periods, extreme weather or courier disruptions can occasionally push delivery out by a couple of days. We'll always keep you posted if that happens."] },
    ],
  },
  returns: {
    eyebrow: "Returns & exchanges",
    title: "DIDN'T WORK\nOUT? EASY FIX.",
    intro: "30 days, no drama — here's how returns and exchanges work.",
    sections: [
      { heading: "Return window", body: ["You have 30 days from the delivery date to return any unworn, unwashed item with its tags still attached."] },
      { heading: "How to return", body: ["Head to Track order, enter your order ID, and choose \"Start a return\". We'll arrange a free pickup from your address."] },
      { heading: "Refunds", body: ["Refunds are processed within 5-7 business days of us receiving the item back, to your original payment method. Cash on delivery orders are refunded to your bank account or UPI ID."] },
      { heading: "Exchanges", body: ["Need a different size or colour instead? Choose exchange rather than refund during the return request, subject to stock availability."] },
      { heading: "What can't be returned", body: ["Innerwear, accessories marked final sale, and any item without its original tags can't be accepted back for hygiene and quality reasons."] },
    ],
  },
  terms: {
    eyebrow: "Legal",
    title: "TERMS OF\nSERVICE.",
    intro: "The essentials of using the MI TRENDS site and placing an order with us.",
    sections: [
      { heading: "Acceptance of terms", body: ["By browsing or buying from MI TRENDS, you agree to these terms. If you don't agree with any part, please don't use the site."] },
      { heading: "Orders & pricing", body: ["All prices are listed in Indian Rupees and include applicable taxes unless stated otherwise. We reserve the right to correct pricing errors and cancel affected orders with a full refund."] },
      { heading: "Payments", body: ["We accept UPI, major debit/credit cards, net banking and cash on delivery. Payments are processed through encrypted, PCI-compliant partners."] },
      { heading: "Shipping & returns", body: ["Delivery timelines and our return policy are detailed on the Shipping and Returns pages, which form part of these terms."] },
      { heading: "Intellectual property", body: ["All designs, graphics and site content belong to MI TRENDS and may not be reproduced without written permission."] },
      { heading: "Limitation of liability", body: ["MI TRENDS is not liable for indirect or incidental damages arising from use of the site, to the extent permitted by Indian law."] },
      { heading: "Governing law", body: ["These terms are governed by the laws of India, with courts in the jurisdiction of our registered office having exclusive authority."] },
      { heading: "Questions", body: ["Write to legal@mitrends.in for anything not covered here."] },
    ],
  },
  privacy: {
    eyebrow: "Legal",
    title: "PRIVACY\nPOLICY.",
    intro: "What we collect, why we collect it, and how it's kept safe.",
    sections: [
      { heading: "Information we collect", body: ["Your name, contact details and delivery address when you check out, plus basic browsing behaviour to improve the site."] },
      { heading: "How we use it", body: ["Solely to process orders, provide support, and — only if you opt in — send you updates about new drops."] },
      { heading: "Cookies", body: ["We use cookies to remember your bag and preferences during a session. You can disable them in your browser, though parts of the site may work less smoothly."] },
      { heading: "Sharing with third parties", body: ["We only share the minimum required data with payment processors and courier partners needed to fulfil your order. We never sell your data."] },
      { heading: "Data security", body: ["Payment details are encrypted end-to-end and we never store your UPI information on our servers."] },
      { heading: "Your rights", body: ["You can request a copy of your data, ask us to correct it, or ask us to delete it by writing to privacy@mitrends.in."] },
    ],
  },
  accessibility: {
    eyebrow: "Accessibility",
    title: "BUILT FOR\nEVERYONE.",
    intro: "We're working to make MI TRENDS usable for every visitor, regardless of ability.",
    sections: [
      { heading: "Our commitment", body: ["We aim to meet WCAG 2.1 Level AA guidelines across the site, and we review new features against them before launch."] },
      { heading: "What we've built in", body: ["Keyboard-navigable menus and carousels, descriptive alt text on product imagery, visible focus states, and colour contrast that holds up in daylight and dark mode alike."] },
      { heading: "Still working on it", body: ["Accessibility is ongoing work, not a one-time checklist. If something doesn't work well with your screen reader, keyboard or browser settings, we want to know."] },
      { heading: "Tell us", body: ["Email accessibility@mitrends.in with the page and issue — we treat these reports as priority fixes."] },
    ],
  },
};

const faqCategories = [
  {
    heading: "Orders & payments",
    items: [
      { q: "Which payment methods do you accept?", a: "UPI, credit and debit cards, net banking, and cash on delivery across India." },
      { q: "Can I change or cancel my order after placing it?", a: "Yes, within 2 hours of placing it — write to us with your order ID. After that, packing has usually already started." },
      { q: "I didn't get an order confirmation. What do I do?", a: "Check your spam or promotions folder first. Still nothing after 30 minutes? Contact us with your registered mobile number and we'll resend it." },
    ],
  },
  {
    heading: "Shipping",
    items: [
      { q: "How long does delivery take?", a: "4-7 business days for most pin codes; metro cities are usually on the faster end." },
      { q: "Is shipping free?", a: "Free on orders above ₹999. Below that, a flat ₹79 fee applies, plus ₹49 for cash on delivery." },
      { q: "Do you ship outside India?", a: "Not yet — we're focused on serving India well before we expand." },
    ],
  },
  {
    heading: "Returns & exchanges",
    items: [
      { q: "What's your return window?", a: "30 days from delivery, for unworn items with tags intact." },
      { q: "How do I start a return?", a: "Go to Track order, enter your order ID, and choose \"Start a return\" — or just contact support." },
      { q: "When will I get my refund?", a: "Within 5-7 business days of us receiving the returned item." },
    ],
  },
  {
    heading: "Sizing",
    items: [
      { q: "How do I pick the right size?", a: "Check our Size guide and compare the measurements with a similar piece you already own." },
      { q: "What if the size doesn't fit?", a: "Exchange it for a different size, free of cost, within the return window." },
    ],
  },
];

const topRows = [
  ["XS", "36", "25", "16.5"],
  ["S", "38", "26", "17.5"],
  ["M", "40", "27", "18.5"],
  ["L", "42", "28", "19.5"],
  ["XL", "44", "29", "20.5"],
  ["XXL", "46", "30", "21.5"],
];
const bottomRows = [
  ["28", "28", "39", "39"],
  ["30", "30", "41", "40"],
  ["32", "32", "43", "41"],
  ["34", "34", "45", "42"],
  ["36", "36", "47", "43"],
  ["38", "38", "49", "44"],
];
const shoeRows = [
  ["UK 6", "25.0", "40"],
  ["UK 7", "25.7", "41"],
  ["UK 8", "26.4", "42"],
  ["UK 9", "27.1", "43"],
  ["UK 10", "27.8", "44"],
  ["UK 11", "28.5", "45"],
];

const trackingStages = ["Order confirmed", "Packed", "Shipped", "Out for delivery", "Delivered"];

function stageFromOrderId(orderId: string) {
  let hash = 0;
  for (let i = 0; i < orderId.length; i += 1) hash = (hash * 31 + orderId.charCodeAt(i)) % 1000;
  return hash % trackingStages.length;
}

function NotFoundInfo() {
  return (
    <section className="not-found">
      <span>404 · Page moved on</span>
      <h1>Can&apos;t find that page.</h1>
      <p>It may have been renamed. Here are a few places to go instead.</p>
      <div className="not-found-links">
        <Link href="/info/faqs">FAQs</Link>
        <Link href="/info/contact">Contact us</Link>
        <Link href="/shop">Shop</Link>
      </div>
      <style jsx>{`
        .not-found { min-height: 68vh; display: grid; place-content: center; justify-items: center; text-align: center; padding: 40px 20px; color: #171717; }
        .not-found span { color: #e5482b; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; font-weight: 800; }
        .not-found h1 { margin: 10px 0; font-size: clamp(42px, 8vw, 88px); line-height: .92; letter-spacing: -.06em; text-transform: uppercase; }
        .not-found p { color: #6c6760; }
        .not-found-links { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px; }
        .not-found-links a { min-height: 46px; padding: 0 20px; display: inline-flex; align-items: center; border: 1px solid #d7d2cb; color: #171717; text-decoration: none; border-radius: 5px; text-transform: uppercase; font-size: 11px; font-weight: 800; letter-spacing: .06em; }
        .not-found-links a:first-child { background: #171717; color: #fff; border-color: #171717; }
      `}</style>
    </section>
  );
}

function InfoHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <header className="info-head">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
      <p>{intro}</p>
    </header>
  );
}

function SimplePageBody({ content }: { content: PageContent }) {
  const [notifyEmail, setNotifyEmail] = useState("");
  const { showToast } = useStore();
  const showNotifyForm = content === SIMPLE_PAGES["gift-cards"] || content === SIMPLE_PAGES.stores;

  const submitNotify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!notifyEmail.trim()) return;
    showToast("You're on the list — we'll email you the moment this is live.");
    setNotifyEmail("");
  };

  return (
    <div className="simple-body">
      {content.sections.map((section) => (
        <section className="simple-section" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      {showNotifyForm && (
        <form className="notify-form" onSubmit={submitNotify}>
          <label htmlFor="notify-email">Get notified</label>
          <div>
            <input id="notify-email" type="email" required placeholder="you@example.com" value={notifyEmail} onChange={(event) => setNotifyEmail(event.target.value)} />
            <button type="submit">Notify me <ArrowRight size={15} /></button>
          </div>
        </form>
      )}
    </div>
  );
}

function ContactBody() {
  const { showToast } = useStore();
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    showToast("Message sent — we'll reply within 24 hours.");
    event.currentTarget.reset();
  };

  return (
    <div className="contact-layout">
      <form className="contact-form" onSubmit={submit}>
        <div className="fields two-col">
          <label><span>Full name</span><input name="name" required placeholder="Your name" /></label>
          <label><span>Email address</span><input name="email" type="email" required placeholder="you@example.com" /></label>
          <label className="full"><span>Order ID (optional)</span><input name="orderId" placeholder="MIT12345678" /></label>
          <label className="full"><span>Message</span><textarea name="message" required rows={5} placeholder="How can we help?" /></label>
        </div>
        <button type="submit">Send message <ArrowRight size={16} /></button>
        {submitted && <p className="confirm"><Check size={14} /> Thanks — expect a reply within 24 hours.</p>}
      </form>

      <aside className="contact-info">
        <div><Mail size={17} /><span><strong>Email</strong><small>support@mitrends.in</small></span></div>
        <div><Phone size={17} /><span><strong>Call / WhatsApp</strong><small>+91 98765 43210</small></span></div>
        <div><Clock size={17} /><span><strong>Hours</strong><small>Mon–Sat, 10am–7pm IST</small></span></div>
        <div className="contact-links"><Link href="/info/faqs">Read our FAQs</Link><Link href="/info/track-order">Track an order</Link></div>
      </aside>
    </div>
  );
}

function FaqsBody() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="faq-body">
      {faqCategories.map((category) => (
        <section key={category.heading} className="faq-category">
          <h2>{category.heading}</h2>
          <div className="faq-list">
            {category.items.map((item) => {
              const id = `${category.heading}-${item.q}`;
              const isOpen = open === id;
              return (
                <div className={`faq-item ${isOpen ? "open" : ""}`} key={id}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}>
                    {item.q}
                    <ChevronDown size={16} aria-hidden="true" />
                  </button>
                  {isOpen && <p>{item.a}</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function TrackOrderBody() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<{ id: string; stage: number } | null>(null);
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = orderId.trim();
    if (trimmed.length < 4) {
      setError("Enter the order ID from your confirmation email.");
      setResult(null);
      return;
    }
    setError("");
    setResult({ id: trimmed, stage: stageFromOrderId(trimmed.toUpperCase()) });
  };

  return (
    <div className="track-body">
      <form className="track-form" onSubmit={submit}>
        <label htmlFor="track-order-id"><span>Order ID</span>
          <div className="track-input"><Search size={16} aria-hidden="true" /><input id="track-order-id" placeholder="e.g. MIT12345678" value={orderId} onChange={(event) => { setOrderId(event.target.value); setError(""); }} /></div>
        </label>
        <button type="submit">Track order</button>
      </form>
      {error && <p className="track-error">{error}</p>}

      {result && (
        <div className="track-result">
          <div className="track-result-head"><strong>{result.id.toUpperCase()}</strong><span>{trackingStages[result.stage]}</span></div>
          <ol className="track-timeline">
            {trackingStages.map((stage, index) => (
              <li key={stage} className={index <= result.stage ? "done" : ""}>
                <span>{index <= result.stage ? <Check size={12} /> : index + 1}</span>
                <p>{stage}</p>
              </li>
            ))}
          </ol>
          {result.stage < trackingStages.length - 1 && <p className="track-note"><Truck size={15} /> We&apos;ll notify you by SMS and email at every step.</p>}
        </div>
      )}

      <p className="track-help">Don&apos;t have your order ID? Check your confirmation email, or <Link href="/info/contact">contact support</Link>.</p>
    </div>
  );
}

function SizeGuideBody() {
  return (
    <div className="size-guide-body">
      <section className="size-table-section">
        <h2><Ruler size={17} aria-hidden="true" /> Tops, tees & hoodies</h2>
        <div className="size-table-wrap">
          <table>
            <thead><tr><th>Size</th><th>Chest (in)</th><th>Length (in)</th><th>Shoulder (in)</th></tr></thead>
            <tbody>{topRows.map((row) => <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="size-table-section">
        <h2><Ruler size={17} aria-hidden="true" /> Joggers, shorts & bottoms</h2>
        <div className="size-table-wrap">
          <table>
            <thead><tr><th>Size</th><th>Waist (in)</th><th>Hip (in)</th><th>Outseam (in)</th></tr></thead>
            <tbody>{bottomRows.map((row) => <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="size-table-section">
        <h2><Ruler size={17} aria-hidden="true" /> Sneakers</h2>
        <div className="size-table-wrap">
          <table>
            <thead><tr><th>Size</th><th>Foot length (cm)</th><th>EU</th></tr></thead>
            <tbody>{shoeRows.map((row) => <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="size-tip">
        <strong>How to measure</strong>
        <p>Lay a similar piece you own flat. Chest is measured pit-to-pit and doubled, length from the highest shoulder point to the hem, and shoulder seam-to-seam. When between two sizes, size up for a relaxed streetwear fit.</p>
      </section>
    </div>
  );
}

function AccountBody() {
  return (
    <div className="account-body">
      <div className="account-icon"><UserRound size={26} /></div>
      <p className="account-copy">Create a MI TRENDS account to keep your wishlist, orders and addresses in one place — or carry on and check out as a guest with just your delivery details.</p>
      <div className="account-links">
        <Link href="/account/login"><UserRound size={17} /><span>Sign in to your account</span><ArrowRight size={15} /></Link>
        <Link href="/account/signup"><Sparkles size={17} /><span>Create an account</span><ArrowRight size={15} /></Link>
        <Link href="/info/track-order"><Package size={17} /><span>Track an order as a guest</span><ArrowRight size={15} /></Link>
        <Link href="/shop"><ShieldCheck size={17} /><span>Continue shopping</span><ArrowRight size={15} /></Link>
      </div>
    </div>
  );
}

export default function InfoPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const special: Record<string, { header: PageContent; body: React.ReactNode }> = {
    contact: { header: { eyebrow: "We're here", title: "TALK TO\nA HUMAN.", intro: "Order questions, sizing help, or just feedback — send it over.", sections: [] }, body: <ContactBody /> },
    faqs: { header: { eyebrow: "Quick answers", title: "FREQUENTLY\nASKED.", intro: "Everything most people ask before or after ordering.", sections: [] }, body: <FaqsBody /> },
    "track-order": { header: { eyebrow: "Where's my order", title: "TRACK YOUR\nORDER.", intro: "Enter your order ID to see the latest status.", sections: [] }, body: <TrackOrderBody /> },
    "size-guide": { header: { eyebrow: "Find your fit", title: "SIZE\nGUIDE.", intro: "Measurements are in inches unless noted, for the most reliable fit.", sections: [] }, body: <SizeGuideBody /> },
    account: { header: { eyebrow: "Your account", title: "YOUR MI TRENDS\nACCOUNT.", intro: "Sign in for saved wishlists and order history, or keep checking out as a guest.", sections: [] }, body: <AccountBody /> },
  };

  let header: PageContent | null = null;
  let body: React.ReactNode = null;

  if (special[slug]) {
    header = special[slug].header;
    body = special[slug].body;
  } else if (SIMPLE_PAGES[slug]) {
    header = SIMPLE_PAGES[slug];
    body = <SimplePageBody content={SIMPLE_PAGES[slug]} />;
  }

  if (!header) return <NotFoundInfo />;

  return (
    <div className="info-page">
      <InfoHeader eyebrow={header.eyebrow} title={header.title} intro={header.intro} />
      {body}
      <style jsx global>{`
      .info-page { width: min(880px, calc(100% - 48px)); margin: 0 auto; padding: 60px 0 110px; color: #171717; }
      .info-head { margin-bottom: 44px; }
      .info-head .eyebrow { display: block; color: #e5482b; font-size: 10px; font-weight: 900; letter-spacing: .13em; text-transform: uppercase; }
      .info-head h1 { margin: 8px 0 14px; font-size: clamp(42px, 7vw, 74px); line-height: .95; letter-spacing: -.06em; text-transform: uppercase; }
      .info-head h1 span { display: block; }
      .info-head p { max-width: 560px; margin: 0; color: #716b64; line-height: 1.6; }

      .simple-body { display: grid; gap: 28px; }
      .simple-section { padding: 26px; border: 1px solid #ddd9d2; border-radius: 10px; background: #fff; }
      .simple-section h2 { margin: 0 0 12px; font-size: 20px; text-transform: uppercase; letter-spacing: -.02em; }
      .simple-section p { margin: 0 0 10px; color: #55514c; line-height: 1.65; font-size: 14px; }
      .simple-section p:last-child { margin-bottom: 0; }

      .notify-form { padding: 24px; border-radius: 10px; background: #171717; color: #fff; }
      .notify-form label { display: block; margin-bottom: 10px; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #d8d4ce; }
      .notify-form div { display: flex; gap: 10px; }
      .notify-form input { flex: 1; min-width: 0; height: 48px; padding: 0 14px; border: 1px solid #3a3a3a; border-radius: 6px; background: #222; color: #fff; font: inherit; font-size: 13px; }
      .notify-form button { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 20px; border: 0; border-radius: 6px; background: #e5482b; color: #fff; font-size: 11px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; cursor: pointer; }

      .contact-layout { display: grid; grid-template-columns: minmax(0,1fr) 300px; gap: 40px; align-items: start; }
      .contact-form { display: grid; gap: 20px; padding: 28px; border: 1px solid #ddd9d2; border-radius: 12px; background: #fff; }
      .fields.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
      .fields label { display: grid; gap: 7px; }
      .fields .full { grid-column: 1 / -1; }
      .fields label > span { font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #55514c; }
      .fields input, .fields textarea { width: 100%; border: 1px solid #d7d2cb; border-radius: 5px; padding: 12px 13px; background: #fff; color: #171717; font: inherit; font-size: 13px; resize: vertical; }
      .contact-form > button { display: flex; align-items: center; justify-content: center; gap: 8px; height: 52px; border: 0; border-radius: 6px; background: #171717; color: #fff; font-size: 11px; font-weight: 900; letter-spacing: .07em; text-transform: uppercase; cursor: pointer; }
      .contact-form .confirm { display: flex; align-items: center; gap: 7px; margin: 0; color: #27734a; font-size: 12px; font-weight: 700; }
      .contact-info { display: grid; gap: 18px; padding: 26px; border: 1px solid #ddd9d2; border-radius: 12px; background: #f5f3ef; }
      .contact-info > div { display: flex; align-items: flex-start; gap: 12px; }
      .contact-info strong { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .02em; }
      .contact-info small { display: block; margin-top: 3px; color: #716b64; font-size: 12px; }
      .contact-links { display: grid; gap: 8px; padding-top: 10px; border-top: 1px solid #ddd9d2; }
      .contact-links a { color: #171717; font-size: 12px; font-weight: 700; text-decoration: underline; }

      .faq-body { display: grid; gap: 34px; }
      .faq-category h2 { margin: 0 0 14px; font-size: 18px; text-transform: uppercase; letter-spacing: -.02em; color: #e5482b; }
      .faq-list { display: grid; gap: 10px; }
      .faq-item { border: 1px solid #ddd9d2; border-radius: 8px; background: #fff; overflow: hidden; }
      .faq-item button { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border: 0; background: none; text-align: left; font-size: 13px; font-weight: 700; color: #171717; cursor: pointer; }
      .faq-item button svg { transition: transform .15s ease; flex: none; }
      .faq-item.open button svg { transform: rotate(180deg); }
      .faq-item p { margin: 0; padding: 0 18px 18px; color: #55514c; font-size: 13px; line-height: 1.6; }

      .track-form { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; padding: 24px; border: 1px solid #ddd9d2; border-radius: 12px; background: #fff; }
      .track-form label { flex: 1; min-width: 200px; display: grid; gap: 7px; }
      .track-form label > span { font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #55514c; }
      .track-input { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 13px; border: 1px solid #d7d2cb; border-radius: 5px; }
      .track-input svg { color: #938d86; flex: none; }
      .track-input input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; font-size: 13px; outline: none; }
      .track-form > button { height: 48px; padding: 0 22px; border: 0; border-radius: 6px; background: #171717; color: #fff; font-size: 11px; font-weight: 900; letter-spacing: .07em; text-transform: uppercase; cursor: pointer; }
      .track-error { margin: 12px 0 0; color: #bd3a25; font-size: 12px; font-weight: 700; }
      .track-result { margin-top: 22px; padding: 26px; border: 1px solid #ddd9d2; border-radius: 12px; background: #fff; }
      .track-result-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 18px; margin-bottom: 22px; border-bottom: 1px dashed #ddd9d2; }
      .track-result-head strong { font-size: 16px; }
      .track-result-head span { color: #27734a; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
      .track-timeline { display: grid; gap: 16px; margin: 0; padding: 0; list-style: none; }
      .track-timeline li { display: grid; grid-template-columns: 28px 1fr; align-items: center; gap: 14px; opacity: .45; }
      .track-timeline li.done { opacity: 1; }
      .track-timeline li > span { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: #f0ede7; font-size: 11px; font-weight: 800; }
      .track-timeline li.done > span { background: #171717; color: #fff; }
      .track-timeline li p { margin: 0; font-size: 13px; font-weight: 700; }
      .track-note { display: flex; align-items: center; gap: 8px; margin: 20px 0 0; padding-top: 18px; border-top: 1px solid #ece8e1; color: #716b64; font-size: 12px; }
      .track-help { margin-top: 20px; color: #716b64; font-size: 13px; }
      .track-help a { color: #171717; font-weight: 700; text-decoration: underline; }

      .size-guide-body { display: grid; gap: 26px; }
      .size-table-section { padding: 24px; border: 1px solid #ddd9d2; border-radius: 12px; background: #fff; }
      .size-table-section h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; font-size: 16px; text-transform: uppercase; letter-spacing: -.01em; }
      .size-table-wrap { overflow-x: auto; border: 1px solid #e6e2db; border-radius: 8px; }
      .size-guide-body table { border-collapse: collapse; width: 100%; min-width: 380px; text-align: left; }
      .size-guide-body th, .size-guide-body td { padding: 11px 15px; border-bottom: 1px solid #ece8e2; font-size: 13px; }
      .size-guide-body th { font-size: 10px; letter-spacing: .06em; text-transform: uppercase; background: #f6f4f0; color: #64605a; }
      .size-guide-body td { font-weight: 600; }
      .size-guide-body tbody tr:last-child td { border-bottom: 0; }
      .size-tip { padding: 20px 22px; border-radius: 10px; background: #f1efe9; }
      .size-tip strong { display: block; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: .02em; }
      .size-tip p { margin: 0; color: #66615b; font-size: 13px; line-height: 1.6; }

      .account-body { display: grid; justify-items: center; gap: 18px; padding: 40px 26px; border: 1px solid #ddd9d2; border-radius: 12px; background: #fff; text-align: center; }
      .account-icon { width: 60px; height: 60px; display: grid; place-items: center; border-radius: 50%; background: #f5f3ef; }
      .account-copy { max-width: 460px; margin: 0; color: #55514c; line-height: 1.65; font-size: 14px; }
      .account-links { display: grid; gap: 10px; width: 100%; max-width: 380px; }
      .account-links a { display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 16px; border: 1px solid #ddd9d2; border-radius: 8px; color: #171717; text-decoration: none; font-size: 13px; font-weight: 700; }
      .account-links a span { flex: 1; text-align: left; }
      .account-links a:hover { background: #f5f3ef; }

      .info-page input:focus-visible, .info-page textarea:focus-visible, .info-page button:focus-visible, .info-page a:focus-visible { outline: 3px solid #f2a078; outline-offset: 2px; }

      @media (max-width: 720px) {
        .contact-layout { grid-template-columns: 1fr; }
      }
      @media (max-width: 560px) {
        .fields.two-col { grid-template-columns: 1fr; }
        .fields .full { grid-column: auto; }
        .track-form { flex-direction: column; align-items: stretch; }
        .track-form > button { width: 100%; }
      }
    `}</style>
    </div>
  );
}
