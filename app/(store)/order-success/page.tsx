"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Mail,
  MapPin,
  Package,
  ShoppingBag,
} from "lucide-react";
import { useStore } from "@/components/StoreProvider";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { showToast } = useStore();
  const [copied, setCopied] = useState(false);

  const order = searchParams.get("order");
  const amount = Number(searchParams.get("amount") || 0);
  const payment = searchParams.get("payment") || "Online";
  const items = Number(searchParams.get("items") || 0);
  const eta = searchParams.get("eta") || "";

  if (!order) {
    return (
      <div className="order-empty">
        <span>Nothing to show</span>
        <h1>No recent order found.</h1>
        <p>Place an order and we’ll show your confirmation right here.</p>
        <Link href="/shop">Start shopping <ArrowRight size={16} /></Link>
        <style jsx>{`
          .order-empty { min-height: 70vh; display: grid; place-content: center; justify-items: center; padding: 40px 20px; text-align: center; color: #171717; }
          .order-empty span { color: #e5482b; font-size: 10px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
          .order-empty h1 { margin: 8px 0; font-size: clamp(38px, 7vw, 68px); line-height: .92; letter-spacing: -.06em; text-transform: uppercase; }
          .order-empty p { color: #716b64; }
          .order-empty a { display: inline-flex; align-items: center; gap: 8px; min-height: 50px; margin-top: 18px; padding: 0 24px; border-radius: 5px; background: #171717; color: #fff; text-decoration: none; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        `}</style>
      </div>
    );
  }

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order);
      setCopied(true);
      showToast("Order ID copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy. Please copy it manually.", "error");
    }
  };

  return (
    <div className="success-page">
      <div className="checkout-progress">
        <span className="done"><Check size={12} />Bag</span><i />
        <span className="done"><Check size={12} />Checkout</span><i />
        <span className="active">3 Done</span>
      </div>

      <section className="hero">
        <div className="badge"><CheckCircle2 size={34} /></div>
        <span className="eyebrow">Order confirmed</span>
        <h1>You’re all set.</h1>
        <p>Thanks for shopping with MI TRENDS. A confirmation is on its way to your inbox.</p>
      </section>

      <section className="order-card">
        <div className="order-id-row">
          <div>
            <small>Order ID</small>
            <strong>{order}</strong>
          </div>
          <button type="button" onClick={copyOrderId} aria-label="Copy order ID">
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="order-grid">
          <div>
            <Package size={17} aria-hidden="true" />
            <span><small>Items</small><strong>{items || 1} {items === 1 ? "piece" : "pieces"}</strong></span>
          </div>
          <div>
            <ShoppingBag size={17} aria-hidden="true" />
            <span><small>Amount paid</small><strong>{money.format(amount)}</strong></span>
          </div>
          <div>
            <Check size={17} aria-hidden="true" />
            <span><small>Payment method</small><strong>{payment}</strong></span>
          </div>
          <div>
            <MapPin size={17} aria-hidden="true" />
            <span><small>Estimated delivery</small><strong>{eta || "5-7 days"}</strong></span>
          </div>
        </div>
      </section>

      <section className="next-steps">
        <h2>What happens next</h2>
        <ol>
          <li><span>01</span><div><strong>Confirmation email</strong><p>We’ve sent your receipt and order details to your inbox.</p></div><Mail size={17} aria-hidden="true" /></li>
          <li><span>02</span><div><strong>Packed with care</strong><p>Your order is picked, checked and packed at our warehouse.</p></div><Package size={17} aria-hidden="true" /></li>
          <li><span>03</span><div><strong>On its way</strong><p>Tracking details are shared once your order ships.</p></div><MapPin size={17} aria-hidden="true" /></li>
        </ol>
      </section>

      <div className="actions">
        <Link href="/shop" className="button button--ink">Continue shopping <ArrowRight size={16} /></Link>
        <Link href="/info/track-order" className="button button--ghost">Track this order</Link>
      </div>

      <style jsx>{`
        .success-page { width: min(760px, calc(100% - 48px)); margin: 0 auto; padding: 24px 0 100px; color: #171717; }
        .checkout-progress { display: flex; align-items: center; justify-content: center; gap: 10px; padding-bottom: 19px; margin-bottom: 40px; border-bottom: 1px solid #ddd9d2; color: #938d86; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; }
        .checkout-progress span { display: flex; align-items: center; gap: 4px; }
        .checkout-progress i { width: 38px; height: 1px; background: #d8d4ce; }
        .checkout-progress .done { color: #27734a; }
        .checkout-progress .active { color: #171717; }
        .hero { text-align: center; }
        .badge { width: 68px; height: 68px; margin: 0 auto 18px; display: grid; place-items: center; border-radius: 50%; background: #eaf6ee; color: #27734a; }
        .eyebrow { display: block; color: #e5482b; font-size: 10px; font-weight: 900; letter-spacing: .13em; text-transform: uppercase; }
        .hero h1 { margin: 8px 0 10px; font-size: clamp(46px, 8vw, 80px); line-height: .92; letter-spacing: -.06em; text-transform: uppercase; }
        .hero p { max-width: 460px; margin: 0 auto; color: #716b64; line-height: 1.6; }
        .order-card { margin-top: 44px; padding: 26px; border: 1px solid #ddd9d2; border-radius: 12px; background: #fff; }
        .order-id-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px dashed #ddd9d2; }
        .order-id-row small { display: block; color: #8a847d; font-size: 9px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
        .order-id-row strong { display: block; margin-top: 4px; font-size: 18px; letter-spacing: .02em; }
        .order-id-row button { display: flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; border: 1px solid #d7d2cb; border-radius: 6px; background: #f5f3ef; color: #171717; font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; cursor: pointer; }
        .order-id-row button:hover { background: #ece8e1; }
        .order-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
        .order-grid > div { display: flex; align-items: flex-start; gap: 10px; color: #625d57; }
        .order-grid small { display: block; color: #8a847d; font-size: 9px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
        .order-grid strong { display: block; margin-top: 3px; font-size: 13px; color: #171717; }
        .next-steps { margin-top: 46px; }
        .next-steps h2 { margin: 0 0 20px; font-size: 26px; text-transform: uppercase; letter-spacing: -.035em; }
        .next-steps ol { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
        .next-steps li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 16px; padding: 16px 18px; border: 1px solid #ddd9d2; border-radius: 10px; background: #fff; }
        .next-steps li > span { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: #f5f3ef; font-size: 10px; font-weight: 800; }
        .next-steps li strong { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .02em; }
        .next-steps li p { margin: 3px 0 0; color: #716b64; font-size: 12px; line-height: 1.5; }
        .next-steps li > svg { color: #a39d94; }
        .actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 44px; }
        .button { display: inline-flex; align-items: center; gap: 8px; min-height: 52px; padding: 0 26px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 900; letter-spacing: .07em; text-transform: uppercase; }
        .button--ink { background: #171717; color: #fff; }
        .button--ghost { border: 1px solid #d7d2cb; color: #171717; }
        @media (max-width: 560px) {
          .order-grid { grid-template-columns: 1fr; }
          .checkout-progress { gap: 6px; font-size: 8px; }
          .checkout-progress i { width: 20px; }
        }
      `}</style>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <OrderSuccessContent />
    </Suspense>
  );
}
