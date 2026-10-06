"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, Check, ChevronDown, LockKeyhole, MapPin, ShieldCheck, Smartphone, Truck } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { useStore } from "@/components/StoreProvider";
import { useCustomer } from "@/lib/account/auth";
import { codPlanFor, DEFAULT_STORE_SETTINGS, readStoreSettings, type StoreSettings } from "@/lib/store-settings";

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: { ondismiss: () => void };
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error: { description: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const states = ["Andhra Pradesh", "Assam", "Bihar", "Delhi", "Goa", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
type PaymentMethod = "upi" | "cod";

export default function CheckoutPage() {
  const store = useStore();
  const router = useRouter();
  const { customer, ready } = useCustomer();
  const [payment, setPayment] = useState<PaymentMethod>("upi");
  // Checkout rules come from the admin panel; defaults apply until they load.
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(readStoreSettings());
  }, []);

  // Checkout is for account holders: send everyone else to sign up first.
  useEffect(() => {
    if (ready && !customer) router.replace("/account/signup?next=/checkout");
  }, [ready, customer, router]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const subtotal = store.cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const couponDiscount = store.couponDiscount || store.coupon?.discount || 0;
  const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.standardShipping;
  const merchandise = Math.max(0, subtotal - couponDiscount);
  const orderValue = merchandise + shipping;
  const codPlan = codPlanFor({ merchandise, shipping }, settings);
  const codFee = payment === "cod" ? settings.codFee : 0;
  const payable = orderValue + codFee;
  // COD collects nothing online — the courier takes the whole amount on delivery.
  const isCod = payment === "cod";
  const dueNow = isCod ? 0 : payable;
  const dueOnDelivery = isCod ? payable : 0;
  const itemCount = store.cartLines.reduce((sum, line) => sum + line.quantity, 0);

  if (payment === "cod" && !codPlan.available) setPayment("upi");

  const eta = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }, []);

  const validate = (data: FormData) => {
    const next: Record<string, string> = {};
    const value = (name: string) => String(data.get(name) || "").trim();
    if (value("name").length < 2) next.name = "Enter the name we should use for delivery.";
    if (!/^[6-9][0-9]{9}$/.test(value("mobile"))) next.mobile = "Enter a valid 10-digit Indian mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email"))) next.email = "Enter a valid email address.";
    if (value("address").length < 8) next.address = "Add a complete house, flat or building address.";
    if (value("area").length < 3) next.area = "Add your road, area or locality.";
    if (!/^[1-9][0-9]{5}$/.test(value("pincode"))) next.pincode = "Enter a valid 6-digit pincode.";
    if (value("city").length < 2) next.city = "Enter your city.";
    if (!value("state")) next.state = "Choose your state.";
    // Nothing to collect for payment here. Razorpay Checkout gathers the UPI ID, the
    // QR scan or the card itself, inside its own window — anything typed here would be
    // thrown away, and a second VPA field only invites a typo that blocks checkout.
    return next;
  };

  // Runs once the order exists server-side — either a verified prepaid payment or a
  // placed COD order. The record itself is created by the server, so nothing to save here.
  const finalizeOrder = (query: URLSearchParams) => {
    window.setTimeout(() => {
      store.clearCart();
      router.push(`/order-success?${query.toString()}`);
    }, 500);
  };

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!store.cartLines.length) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextErrors = validate(data);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      requestAnimationFrame(() => {
        const field = form.elements.namedItem(firstError);
        if (field instanceof HTMLElement) {
          field.focus();
          field.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
      return;
    }

    setPaymentError("");
    setSubmitting(true);
    const paymentLabel = { upi: "UPI", cod: "Cash on delivery" }[payment];
    const value = (name: string) => String(data.get(name) || "").trim();

    const orderPayload = {
      lines: store.cartLines.map((line) => ({
        productId: line.product.id,
        size: line.size,
        color: line.color.name,
        quantity: line.quantity,
      })),
      couponCode: store.coupon?.code ?? store.couponCode ?? null,
      shipping,
      codFee,
      contact: {
        name: value("name"),
        email: value("email"),
        phone: value("mobile"),
        address: {
          line1: value("address"),
          area: value("area"),
          city: value("city"),
          state: value("state"),
          pincode: value("pincode"),
        },
      },
    };

    // Cash on delivery places the order outright — no gateway, nothing charged now.
    if (isCod) {
      try {
        const response = await fetch("/api/orders/cod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Could not place your order.");

        finalizeOrder(
          new URLSearchParams({
            order: data.reference,
            amount: String(data.breakdown.total),
            payment: paymentLabel,
            items: String(itemCount),
            eta,
            advance: "0",
            balance: String(data.breakdown.dueOnDelivery),
          }),
        );
      } catch (error) {
        setSubmitting(false);
        setPaymentError(error instanceof Error ? error.message : "Could not place your order.");
      }
      return;
    }

    try {
      const createRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...orderPayload, paymentMode: payment }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Could not start the payment.");

      // The server owns the order reference and the authoritative totals.
      const query = new URLSearchParams({
        order: createData.reference,
        amount: String(createData.breakdown.total),
        payment: paymentLabel,
        items: String(itemCount),
        eta,
      });

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount: createData.amount,
        currency: createData.currency,
        name: "MI TRENDS",
        description: "Order payment",
        order_id: createData.order_id,
        prefill: { name: value("name"), email: value("email"), contact: value("mobile") },
        theme: { color: "#e5482b" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.error || "Payment verification failed.");
            finalizeOrder(query);
          } catch (error) {
            setSubmitting(false);
            setPaymentError(error instanceof Error ? error.message : "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setPaymentError("Payment cancelled.");
          },
        },
      });
      razorpay.on("payment.failed", (response) => {
        setSubmitting(false);
        setPaymentError(response.error?.description || "Payment failed. Please try again.");
      });
      razorpay.open();
    } catch (error) {
      setSubmitting(false);
      setPaymentError(error instanceof Error ? error.message : "Could not start the payment.");
    }
  };

  if (!ready || !customer) {
    return (
      <div className="checkout-empty">
        <span>{ready ? "Account needed" : "Checking your account"}</span>
        <h1>{ready ? "Sign up to check out." : "One moment."}</h1>
        <p>
          {ready
            ? "MI TRENDS orders are tied to an account so you can track delivery and returns. Creating one takes a few seconds — your bag is waiting."
            : "Bringing up your details."}
        </p>
        {ready && <Link href="/account/signup?next=/checkout">Create an account</Link>}
      </div>
    );
  }

  if (!store.cartLines.length) {
    return (
      <div className="checkout-empty">
        <span>Nothing to check out yet</span><h1>Your bag is empty.</h1><p>Add at least one style before moving to payment.</p>
        <Link href="/shop">Browse the latest drop</Link>
        <style jsx>{`
          .checkout-empty{min-height:70vh;display:grid;place-content:center;justify-items:center;padding:40px 20px;text-align:center;color:#171717}.checkout-empty span{color:#e5482b;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.checkout-empty h1{margin:8px 0;font-size:clamp(42px,8vw,80px);line-height:.92;letter-spacing:-.06em;text-transform:uppercase}.checkout-empty p{color:#716b64}.checkout-empty a{min-height:50px;margin-top:18px;padding:0 24px;display:flex;align-items:center;border-radius:5px;background:#171717;color:#fff;text-decoration:none;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
        `}</style>
      </div>
    );
  }

  const fieldError = (name: string) => errors[name] ? <span className="field-error" id={`${name}-error`}>{errors[name]}</span> : null;

  return (
    <div className="checkout-page">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="checkout-top">
        <Link href="/cart"><ArrowLeft size={15} />Back to bag</Link>
        <div className="checkout-progress"><span className="done"><Check size={12} />Bag</span><i /><span className="active">2 Checkout</span><i /><span>3 Done</span></div>
        <span><LockKeyhole size={14} />Secure checkout</span>
      </div>

      <header><span>Almost yours</span><h1>Checkout</h1><p>One page. No surprises. Your total updates as you choose.</p></header>

      <form onSubmit={placeOrder} noValidate>
        <div className="checkout-layout">
          <div className="panels">
            <section className="panel">
              <div className="panel-title"><b>01</b><div><span>Your details</span><h2>Contact</h2></div></div>
              <div className="fields two-col">
                <label><span>Full name</span><input name="name" defaultValue={customer.name} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} placeholder="Your full name" onChange={() => setErrors((old) => ({ ...old, name: "" }))} />{fieldError("name")}</label>
                <label><span>Mobile number</span><div className="phone"><i>+91</i><input name="mobile" defaultValue={(customer.phone ?? "").replace(/\D/g, "").slice(-10)} inputMode="numeric" autoComplete="tel" maxLength={10} aria-invalid={Boolean(errors.mobile)} aria-describedby={errors.mobile ? "mobile-error" : undefined} placeholder="10-digit number" onChange={() => setErrors((old) => ({ ...old, mobile: "" }))} /></div>{fieldError("mobile")}</label>
                <label className="full"><span>Email address</span><input name="email" type="email" defaultValue={customer.email} autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} placeholder="you@example.com" onChange={() => setErrors((old) => ({ ...old, email: "" }))} />{fieldError("email")}<small>Order updates and your invoice will arrive here.</small></label>
              </div>
            </section>

            <section className="panel">
              <div className="panel-title"><b>02</b><div><span>Where it’s going</span><h2>Delivery address</h2></div></div>
              <div className="fields two-col">
                <label className="full"><span>Flat, house or building</span><input name="address" autoComplete="address-line1" aria-invalid={Boolean(errors.address)} placeholder="House number and building" onChange={() => setErrors((old) => ({ ...old, address: "" }))} />{fieldError("address")}</label>
                <label className="full"><span>Road, area or locality</span><input name="area" autoComplete="address-line2" aria-invalid={Boolean(errors.area)} placeholder="Area and nearby landmark" onChange={() => setErrors((old) => ({ ...old, area: "" }))} />{fieldError("area")}</label>
                <label><span>Pincode</span><input name="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} aria-invalid={Boolean(errors.pincode)} placeholder="6-digit pincode" onChange={() => setErrors((old) => ({ ...old, pincode: "" }))} />{fieldError("pincode")}</label>
                <label><span>City</span><input name="city" autoComplete="address-level2" aria-invalid={Boolean(errors.city)} placeholder="City" onChange={() => setErrors((old) => ({ ...old, city: "" }))} />{fieldError("city")}</label>
                <label className="full"><span>State</span><div className="select-wrap"><select name="state" autoComplete="address-level1" defaultValue="" aria-invalid={Boolean(errors.state)} onChange={() => setErrors((old) => ({ ...old, state: "" }))}><option value="" disabled>Choose state</option>{states.map((state) => <option key={state}>{state}</option>)}</select><ChevronDown size={15} /></div>{fieldError("state")}</label>
                <fieldset className="full type-choice"><legend>Save as</legend><label><input type="radio" name="addressType" value="home" defaultChecked /><span>Home</span></label><label><input type="radio" name="addressType" value="work" /><span>Work</span></label><label><input type="radio" name="addressType" value="other" /><span>Other</span></label></fieldset>
              </div>
            </section>

            <section className="panel payment-panel">
              <div className="panel-title"><b>03</b><div><span>Pay your way</span><h2>Payment</h2></div></div>
              <div className="payment-methods">
                <label className={payment === "upi" ? "active" : ""}><input type="radio" name="payment" checked={payment === "upi"} onChange={() => setPayment("upi")} /><Smartphone size={18} /><span><strong>UPI</strong><small>Google Pay, PhonePe, BHIM or any UPI app</small></span></label>
                <label className={`${payment === "cod" ? "active" : ""}${codPlan.available ? "" : " disabled"}`.trim()}>
                  <input type="radio" name="payment" checked={payment === "cod"} disabled={!codPlan.available} onChange={() => setPayment("cod")} />
                  <Banknote size={18} />
                  <span>
                    <strong>Cash on delivery</strong>
                    <small>
                      {codPlan.available
                        ? `Pay on delivery · ${money.format(settings.codFee)} fee`
                        : codPlan.reason === "disabled"
                          ? "Unavailable right now"
                          : `Only on orders above ${money.format(settings.codMinimumOrder)}`}
                    </small>
                  </span>
                </label>
              </div>

              <div className="payment-detail">
                {isCod ? (
                  <div className="cod-note">
                    <Truck size={19} />
                    <div>
                      <strong>Pay {money.format(dueOnDelivery)} on delivery</strong>
                      <p>
                        Nothing to pay now. The courier collects {money.format(dueOnDelivery)} — including the{" "}
                        {money.format(settings.codFee)} handling fee — when your order arrives. Please keep the
                        exact amount ready.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="pay-note">
                    <ShieldCheck size={16} aria-hidden="true" />
                    <p>
                      Tap <strong>Pay</strong> and the secure Razorpay window opens. Scan the QR with
                      any UPI app, or pick Google&nbsp;Pay, PhonePe, Paytm or BHIM — you approve it
                      there and land back here with the order confirmed.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside>
            <div className="summary">
              <span className="summary-kicker">Your order</span><h2>{itemCount} {itemCount === 1 ? "piece" : "pieces"}</h2>
              <div className="summary-items">
                {store.cartLines.map((line) => <article key={line.key}><div className="summary-image"><ProductVisual product={line.product} /><b>{line.quantity}</b></div><div><strong>{line.product.name}</strong><span>{line.color.name} · {line.size}</span></div><em>{money.format(line.product.price * line.quantity)}</em></article>)}
              </div>
              <div className="eta"><MapPin size={16} /><span><small>Estimated delivery</small><strong>By {eta}</strong></span></div>
              <dl><div><dt>Subtotal</dt><dd>{money.format(subtotal)}</dd></div>{couponDiscount > 0 && <div className="saving"><dt>Coupon</dt><dd>− {money.format(couponDiscount)}</dd></div>}<div><dt>Shipping</dt><dd>{shipping ? money.format(shipping) : <span>Free</span>}</dd></div>{codFee > 0 && <div><dt>COD fee</dt><dd>{money.format(codFee)}</dd></div>}<div className="total"><dt>Order total</dt><dd>{money.format(payable)}</dd></div>{isCod && <><div><dt>Amount paid</dt><dd>{money.format(0)}</dd></div><div><dt>Due on delivery</dt><dd>{money.format(dueOnDelivery)}</dd></div></>}</dl>
              {paymentError && <p className="payment-error">{paymentError}</p>}
              <p className="legal-note">
                By placing this order you agree to our <Link href="/info/terms">Terms &amp; Conditions</Link>,{" "}
                <Link href="/info/privacy">Privacy Policy</Link> and <Link href="/info/returns">Return &amp; Refund Policy</Link>.
              </p>
              <button type="submit" disabled={submitting}>{submitting ? "Placing your order…" : isCod ? <>Place order · pay {money.format(dueOnDelivery)} on delivery <Truck size={15} /></> : <>Pay {money.format(dueNow)} <LockKeyhole size={15} /></>}</button>
              <div className="trust"><ShieldCheck size={16} /><span><strong>Payments are encrypted</strong>We never store your full card or UPI details.</span></div>
            </div>
          </aside>
        </div>
      </form>

      <style jsx>{`
        .checkout-page{width:min(1240px,calc(100% - 48px));margin:0 auto;padding:24px 0 100px;color:#171717}.checkout-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding-bottom:19px;border-bottom:1px solid #ddd9d2}.checkout-top>a,.checkout-top>span{display:flex;align-items:center;gap:6px;color:#66615b;font-size:10px;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:.05em}.checkout-top>span{justify-self:end}.checkout-progress{display:flex;align-items:center;gap:10px;color:#938d86;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}.checkout-progress span{display:flex;align-items:center;gap:4px}.checkout-progress i{width:38px;height:1px;background:#d8d4ce}.checkout-progress .done{color:#27734a}.checkout-progress .active{color:#171717}header{margin:55px 0 36px}header>span,.summary-kicker,.panel-title div>span{color:#e5482b;font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}h1{margin:7px 0 8px;font-size:clamp(46px,6vw,76px);line-height:.92;letter-spacing:-.06em;text-transform:uppercase}header p{margin:0;color:#716b64;font-size:13px}.checkout-layout{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:clamp(35px,6vw,75px);align-items:start}.panels{display:grid;gap:16px}.panel{padding:28px;border:1px solid #ddd9d2;border-radius:10px;background:#fff}.panel-title{display:flex;align-items:flex-start;gap:16px;margin-bottom:25px}.panel-title>b{width:35px;height:35px;display:grid;place-items:center;border-radius:50%;background:#171717;color:#fff;font-size:10px}.panel-title div>span{display:block;margin:1px 0 3px}.panel-title h2{margin:0;font-size:26px;line-height:1;letter-spacing:-.035em;text-transform:uppercase}.fields{display:grid;gap:18px}.two-col{grid-template-columns:1fr 1fr}.full{grid-column:1/-1}.fields label,.payment-detail>label{display:grid;gap:7px;align-content:start}.fields label>span,.payment-detail label>span{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.fields input,.fields select,.payment-detail input,.payment-detail select{width:100%;min-width:0;height:48px;border:1px solid #d7d2cb;border-radius:5px;padding:0 13px;background:#fff;color:#171717;font:inherit;font-size:12px}.fields input[aria-invalid=true],.fields select[aria-invalid=true],.payment-detail input[aria-invalid=true],.payment-detail select[aria-invalid=true]{border-color:#c83d28;background:#fff9f7}.fields label>small,.payment-detail label>small{color:#8a847d;font-size:9px}.field-error{color:#bd3a25!important;font-size:9px!important;font-weight:700!important;letter-spacing:0!important;text-transform:none!important}.phone{display:flex}.phone i{height:48px;display:flex;align-items:center;padding:0 12px;border:1px solid #d7d2cb;border-right:0;border-radius:5px 0 0 5px;background:#f5f3ef;color:#625d57;font-size:11px;font-style:normal}.phone input{border-radius:0 5px 5px 0}.select-wrap{position:relative}.select-wrap select{appearance:none;padding-right:42px}.select-wrap :global(svg){position:absolute;right:14px;top:17px;pointer-events:none}.type-choice{display:flex!important;flex-wrap:wrap;gap:8px!important;border:0;padding:0;margin:2px 0 0}.type-choice legend{width:100%;margin-bottom:2px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.type-choice label{display:block;position:relative}.type-choice input{position:absolute;opacity:0}.type-choice label span{min-width:76px;height:38px;display:grid;place-items:center;padding:0 13px;border:1px solid #d7d2cb;border-radius:5px;font-size:10px;font-weight:700}.type-choice input:checked+span{border-color:#171717;background:#171717;color:#fff}.payment-methods{display:grid;grid-template-columns:1fr 1fr;gap:8px}.payment-methods>label{display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:9px;min-height:68px;padding:10px 12px;border:1px solid #d8d4cd;border-radius:6px;cursor:pointer}.payment-methods>label.active{border-color:#171717;background:#f5f3ef;box-shadow:inset 0 0 0 1px #171717}.payment-methods>label.disabled{opacity:.55;cursor:not-allowed;background:#faf8f5}.payment-methods input{accent-color:#171717}.payment-methods label>span{display:grid;gap:3px}.payment-methods strong{font-size:11px}.payment-methods small{color:#77716a;font-size:8px;line-height:1.3}.payment-detail{margin-top:16px;padding:18px;border-radius:7px;background:#f5f3ef}.card-fields{gap:13px}.cod-note{display:flex;gap:10px}.cod-note strong{font-size:12px}.cod-note p{margin:4px 0 0;color:#716b64;font-size:10px;line-height:1.5}aside{position:sticky;top:116px}.summary{padding:27px;border-radius:10px;background:#171717;color:#fff}.summary h2{margin:5px 0 20px;font-size:30px;line-height:1;text-transform:uppercase;letter-spacing:-.04em}.summary-items{display:grid;gap:13px;max-height:310px;overflow:auto;padding-right:4px}.summary-items article{display:grid;grid-template-columns:58px minmax(0,1fr) auto;align-items:center;gap:10px}.summary-image{position:relative;aspect-ratio:3/4;overflow:hidden;border-radius:4px;background:#eee9e2}.summary-image :global(svg){width:100%;height:100%}.summary-image b{position:absolute;right:3px;top:3px;min-width:18px;height:18px;display:grid;place-items:center;border-radius:50%;background:#fff;color:#171717;font-size:8px}.summary-items article>div:nth-child(2){display:grid;gap:4px;min-width:0}.summary-items article strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;text-transform:uppercase}.summary-items article span{color:#a9a49d;font-size:8px}.summary-items em{font-size:10px;font-style:normal;font-weight:800}.eta{display:flex;gap:9px;align-items:center;margin:22px 0;padding:13px;border:1px solid #393939;border-radius:6px;background:#222}.eta span{display:grid;gap:3px}.eta small{color:#aaa59e;font-size:8px;text-transform:uppercase;letter-spacing:.07em}.eta strong{font-size:10px}.summary dl{display:grid;gap:12px;margin:0}.summary dl>div{display:flex;justify-content:space-between;gap:15px;color:#c8c3bc;font-size:10px}.summary dt,.summary dd{margin:0}.summary dd{color:#fff;font-weight:700}.summary .saving,.summary .saving dd,.summary dd>span{color:#74c995}.summary dl .total{margin-top:4px;padding-top:16px;border-top:1px solid #393939;color:#fff;font-size:15px;font-weight:900}.payment-error{margin:16px 0 0;padding:10px 12px;border-radius:5px;background:#3a1512;color:#f5a393;font-size:10px;font-weight:700}.legal-note{margin:14px 0 0;color:#a9a49d;font-size:9px;line-height:1.5}.legal-note :global(a){color:#ddd9d2;text-decoration:underline;text-underline-offset:2px}.legal-note :global(a:hover){color:#fff}.summary>button{width:100%;min-height:54px;margin-top:20px;display:flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:5px;background:#e5482b;color:#fff;font-size:11px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}.summary>button:disabled{opacity:.7;cursor:wait}.trust{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:15px;color:#aaa59e;font-size:8px}.trust span{display:grid;gap:2px}.trust strong{color:#ddd9d2}input:focus-visible,select:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid #f2a078;outline-offset:2px}@media(max-width:900px){.checkout-layout{grid-template-columns:1fr}.checkout-top{grid-template-columns:1fr 1fr}.checkout-progress{display:none}aside{position:static}.summary{max-width:none}.payment-methods{grid-template-columns:1fr}}@media(max-width:620px){.checkout-page{width:calc(100% - 24px);padding-top:17px}.checkout-top>span{font-size:0}.checkout-top>span :global(svg){width:18px;height:18px}header{margin:38px 0 25px}.panel{padding:21px 16px}.two-col{grid-template-columns:1fr}.full{grid-column:auto}.type-choice{grid-column:auto!important}.panel-title{gap:12px}.payment-methods>label{min-height:62px}.summary{padding:22px 17px}}
      `}</style>
    </div>
  );
}
