"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus, Plus, ShieldCheck, ShoppingBag, Tag, Trash2, Truck } from "lucide-react";
import { products } from "@/lib/catalog";
import { ProductVisual } from "@/components/ProductVisual";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/components/StoreProvider";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const FREE_SHIPPING = 999;

export default function CartPage() {
  const store = useStore();
  const [couponInput, setCouponInput] = useState(store.couponCode || "");
  const [couponMessage, setCouponMessage] = useState("");
  const cart = store.cartLines;
  const itemMrp = cart.reduce((sum, line) => sum + line.product.mrp * line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const productDiscount = itemMrp - subtotal;
  const couponDiscount = store.couponDiscount || store.coupon?.discount || 0;
  const shipping = subtotal >= FREE_SHIPPING ? 0 : 79;
  const total = Math.max(0, subtotal - couponDiscount) + shipping;
  const remaining = Math.max(0, FREE_SHIPPING - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING) * 100);

  const suggestions = useMemo(() => products.filter((product) => !cart.some((line) => line.product.id === product.id)).slice(0, 4), [cart]);

  const applyCoupon = () => {
    const value = couponInput.trim().toUpperCase();
    if (!value) {
      setCouponMessage("Enter a coupon code to continue.");
      return;
    }
    const applied = store.applyCoupon(value);
    setCouponMessage(applied ? `${value} is now working on your bag.` : "That code is invalid or your bag does not meet the minimum.");
  };

  if (!cart.length) {
    return (
      <div className="empty-cart">
        <div className="empty-icon"><ShoppingBag size={30} /></div>
        <span>Your bag is taking a break</span>
        <h1>Ready when you are.</h1>
        <p>Build a rotation from fresh graphics, heavyweight essentials and everyday extras.</p>
        <Link href="/shop">Start shopping <ArrowRight size={16} /></Link>
        <section>
          <div><small>Good place to start</small><h2>Trending right now</h2></div>
          <div className="empty-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} compact />)}</div>
        </section>
        <style jsx>{`
          .empty-cart { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 70px 0 100px; text-align: center; }
          .empty-icon { width: 76px; height: 76px; margin: auto; display: grid; place-items: center; border-radius: 50%; background: #f0ede7; }
          span, small { display: block; margin-top: 18px; color: #e5482b; font-size: 10px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
          h1 { margin: 9px 0; font-size: clamp(44px, 7vw, 82px); line-height: .92; letter-spacing: -.06em; text-transform: uppercase; }
          p { max-width: 510px; margin: auto; color: #716b64; line-height: 1.6; }
          a { display: inline-flex; align-items: center; gap: 9px; min-height: 50px; margin-top: 24px; padding: 0 25px; border-radius: 5px; background: #171717; color: #fff; text-decoration: none; font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
          section { margin-top: 100px; padding-top: 45px; border-top: 1px solid #dedad4; text-align: left; }
          section small { margin: 0; } h2 { margin: 6px 0 24px; font-size: 34px; text-transform: uppercase; letter-spacing: -.04em; }
          .empty-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 14px; }
          @media(max-width:700px){ .empty-cart { padding-top: 50px; } section { margin-top: 70px; } .empty-grid { display:flex; overflow-x:auto; gap:8px; } .empty-grid > :global(*){flex:0 0 72%;} }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header>
        <div><span className="eyebrow">Your current rotation</span><h1>Shopping bag</h1></div>
        <p>{store.cartCount} {store.cartCount === 1 ? "item" : "items"}</p>
      </header>

      <div className="shipping-nudge">
        <div><Truck size={17} /><span>{remaining > 0 ? <>Add <strong>{money.format(remaining)}</strong> for free shipping</> : <><strong>Free shipping unlocked.</strong> Nice move.</>}</span></div>
        <div className="shipping-track"><i style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="cart-layout">
        <section className="items" aria-label="Bag items">
          {cart.map((line) => (
            <article className="line" key={line.key}>
              <Link className="line-image" href={`/product/${line.product.slug}`} aria-label={`View ${line.product.name}`}><ProductVisual product={line.product} /></Link>
              <div className="line-copy">
                <div>
                  <Link className="line-collection" href={`/shop?collection=${line.product.collectionSlug}`}>{line.product.collection}</Link>
                  <h2><Link href={`/product/${line.product.slug}`}>{line.product.name}</Link></h2>
                  <p><span><i style={{ background: line.color.hex }} />{line.color.name}</span><span>Size {line.size}</span></p>
                </div>
                <div className="line-bottom">
                  <div className="qty" aria-label={`Quantity for ${line.product.name}`}>
                    <button type="button" aria-label="Decrease quantity" onClick={() => store.updateQuantity(line.key, line.quantity - 1)}><Minus size={14} /></button>
                    <span>{line.quantity}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => store.updateQuantity(line.key, line.quantity + 1)}><Plus size={14} /></button>
                  </div>
                  <button className="remove" type="button" onClick={() => store.removeFromCart(line.key)}><Trash2 size={15} />Remove</button>
                </div>
              </div>
              <div className="line-price"><strong>{money.format(line.product.price * line.quantity)}</strong>{line.product.mrp > line.product.price && <del>{money.format(line.product.mrp * line.quantity)}</del>}</div>
            </article>
          ))}

          <div className="keep-shopping"><Link href="/shop">← Keep shopping</Link><button type="button" onClick={store.clearCart}>Clear bag</button></div>
        </section>

        <aside>
          <div className="summary">
            <span className="summary-kicker">Order overview</span>
            <h2>Price summary</h2>

            <div className="coupon">
              <label htmlFor="coupon"><Tag size={15} /> Have a coupon?</label>
              <div><input id="coupon" value={couponInput} onChange={(event) => { setCouponInput(event.target.value.toUpperCase()); setCouponMessage(""); }} placeholder="Enter code" /><button type="button" onClick={applyCoupon}>{store.coupon ? "Change" : "Apply"}</button></div>
              {store.coupon && <button className="coupon-active" type="button" onClick={() => { store.clearCoupon(); setCouponInput(""); setCouponMessage("Coupon removed."); }}><Check size={13} />{store.couponCode} applied · remove</button>}
              {couponMessage && <p className={store.coupon ? "good" : "bad"} aria-live="polite">{couponMessage}</p>}
              <div className="code-hints"><button type="button" onClick={() => setCouponInput("HYPE10")}>HYPE10</button><button type="button" onClick={() => setCouponInput("FLAT200")}>FLAT200</button><button type="button" onClick={() => setCouponInput("FIRST15")}>FIRST15</button></div>
            </div>

            <dl>
              <div><dt>Item total</dt><dd>{money.format(itemMrp)}</dd></div>
              <div className="saving"><dt>Product discount</dt><dd>− {money.format(productDiscount)}</dd></div>
              {couponDiscount > 0 && <div className="saving"><dt>Coupon saving</dt><dd>− {money.format(couponDiscount)}</dd></div>}
              <div><dt>Shipping</dt><dd>{shipping ? money.format(shipping) : <span>Free</span>}</dd></div>
              <div className="total"><dt>Total to pay</dt><dd>{money.format(total)}</dd></div>
            </dl>
            <p className="total-saving">You save {money.format(productDiscount + couponDiscount)} on this order</p>
            <Link className="checkout" href="/checkout">Secure checkout <span>{money.format(total)}</span></Link>
            <div className="secure"><ShieldCheck size={16} /><span><strong>Safe & secure payments</strong>Your information stays protected.</span></div>
          </div>
        </aside>
      </div>

      <section className="suggestions">
        <div><span className="eyebrow">One more thing</span><h2>Complete the look</h2></div>
        <div className="suggestion-grid">{suggestions.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <style jsx>{`
        .cart-page { width: min(1320px, calc(100% - 48px)); margin: 0 auto; padding: 44px 0 100px; color: #171717; }
        header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
        .eyebrow, .summary-kicker { color: #e5482b; font-size: 10px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
        h1 { margin: 7px 0 0; font-size: clamp(46px, 6vw, 76px); line-height: .92; letter-spacing: -.06em; text-transform: uppercase; }
        header p { color: #716b64; font-size: 13px; }
        .shipping-nudge { margin-bottom: 24px; padding: 14px 16px; border-radius: 8px; background: #f3f0ea; }
        .shipping-nudge > div:first-child { display: flex; align-items: center; gap: 8px; font-size: 12px; }
        .shipping-track { height: 4px; margin-top: 11px; overflow: hidden; border-radius: 99px; background: #ded9d1; }
        .shipping-track i { display: block; height: 100%; border-radius: inherit; background: #1e7345; transition: width .3s ease; }
        .cart-layout { display: grid; grid-template-columns: minmax(0,1fr) 390px; gap: clamp(32px,5vw,72px); align-items: start; }
        .items { border-top: 1px solid #dcd8d1; }
        .line { position: relative; display: grid; grid-template-columns: 150px minmax(0,1fr) auto; gap: 20px; padding: 22px 0; border-bottom: 1px solid #dcd8d1; }
        .line-image { display: grid; aspect-ratio: 3/4; overflow: hidden; border-radius: 7px; background: #efebe5; }
        .line-image :global(svg) { width: 100%; height: 100%; }
        .line-copy { display: flex; flex-direction: column; justify-content: space-between; min-width: 0; padding: 3px 0; }
        .line-collection { color: #e5482b; font-size: 9px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; }
        .line h2 { margin: 6px 0 9px; font-size: clamp(17px,2vw,22px); line-height: 1.08; letter-spacing: -.025em; text-transform: uppercase; }
        .line h2 a { color: inherit; text-decoration: none; }
        .line-copy p { display: flex; gap: 14px; margin: 0; color: #77716a; font-size: 11px; }
        .line-copy p span { display: flex; align-items: center; gap: 5px; }
        .line-copy p i { width: 10px; height: 10px; border-radius: 50%; border: 1px solid rgba(0,0,0,.12); }
        .line-bottom { display: flex; align-items: center; gap: 18px; }
        .qty { display: grid; grid-template-columns: 32px 34px 32px; align-items: center; min-height: 36px; border: 1px solid #d9d5ce; border-radius: 5px; }
        .qty button { border: 0; background: none; display: grid; place-items: center; cursor: pointer; }
        .qty span { text-align: center; font-size: 12px; font-weight: 800; }
        .remove { display: inline-flex; align-items: center; gap: 5px; border: 0; background: none; color: #77716a; font-size: 10px; font-weight: 700; text-transform: uppercase; cursor: pointer; }
        .line-price { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; padding-top: 3px; }
        .line-price strong { font-size: 15px; } .line-price del { color: #918b84; font-size: 11px; }
        .keep-shopping { display: flex; justify-content: space-between; padding-top: 18px; }
        .keep-shopping a, .keep-shopping button { border: 0; background: none; color: #55504a; font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; cursor: pointer; }
        aside { position: sticky; top: 120px; }
        .summary { padding: 27px; border: 1px solid #dcd8d1; border-radius: 10px; background: #faf9f7; }
        .summary h2 { margin: 6px 0 22px; font-size: 31px; line-height: 1; letter-spacing: -.04em; text-transform: uppercase; }
        .coupon { padding-bottom: 21px; border-bottom: 1px solid #ddd9d3; }
        .coupon label { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
        .coupon > div { display: flex; }
        .coupon input { min-width: 0; flex: 1; min-height: 45px; border: 1px solid #d6d1ca; border-right: 0; border-radius: 5px 0 0 5px; padding: 0 12px; background: #fff; font: inherit; font-size: 12px; text-transform: uppercase; }
        .coupon > div > button { min-width: 74px; border: 1px solid #171717; border-radius: 0 5px 5px 0; background: #171717; color: #fff; font-size: 10px; font-weight: 900; text-transform: uppercase; cursor: pointer; }
        .coupon-active { display: flex; align-items: center; gap: 5px; margin-top: 10px; border: 0; padding: 0; background: none; color: #197241; font-size: 10px; font-weight: 800; cursor: pointer; }
        .coupon p { margin: 9px 0 0; font-size: 10px; line-height: 1.4; }.coupon p.good { color: #197241; }.coupon p.bad { color: #bd3a25; }
        .code-hints { gap: 5px; margin-top: 11px; }
        .code-hints button { min-width: auto!important; min-height: 26px; padding: 0 7px; border: 1px dashed #c8aa78!important; border-radius: 3px!important; background: #fff8e9!important; color: #79471e!important; font-size: 8px!important; }
        dl { display: grid; gap: 13px; margin: 22px 0 0; }
        dl div { display: flex; justify-content: space-between; gap: 20px; color: #625d57; font-size: 12px; }
        dt,dd { margin: 0; } dd { color: #292622; font-weight: 700; }.saving dd,.saving { color: #197241; }
        dl .total { margin-top: 4px; padding-top: 17px; border-top: 1px solid #dcd8d1; color: #171717; font-size: 16px; font-weight: 900; }
        dl dd span { color: #197241; text-transform: uppercase; font-size: 10px; }
        .total-saving { margin: 13px 0 0; padding: 9px 10px; border-radius: 4px; background: #e7f3eb; color: #17663b; font-size: 10px; font-weight: 800; text-align: center; }
        .checkout { min-height: 54px; margin-top: 14px; display: flex; align-items: center; justify-content: space-between; padding: 0 17px; border-radius: 5px; background: #e5482b; color: #fff; text-decoration: none; font-size: 10px; font-weight: 900; letter-spacing: .07em; text-transform: uppercase; }
        .checkout span { font-size: 13px; }
        .secure { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 15px; color: #77716a; font-size: 9px; }
        .secure span { display: grid; gap: 2px; }.secure strong { color: #4b4742; }
        .suggestions { margin-top: 100px; padding-top: 46px; border-top: 1px solid #dedad4; }
        .suggestions h2 { margin: 6px 0 23px; font-size: clamp(30px,4vw,48px); line-height: .95; letter-spacing: -.05em; text-transform: uppercase; }
        .suggestion-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 14px; }
        button:focus-visible,input:focus-visible,a:focus-visible { outline: 3px solid #f2a078; outline-offset: 3px; }
        @media(max-width:900px){ .cart-layout{grid-template-columns:1fr;} aside{position:static;} .summary{max-width:none;} }
        @media(max-width:620px){
          .cart-page{width:calc(100% - 24px);padding-top:28px;}.line{grid-template-columns:100px minmax(0,1fr);gap:13px;}.line-price{position:absolute;right:0;bottom:25px}.line-bottom{padding-bottom:39px}.line-copy p{flex-direction:column;gap:4px}.summary{padding:22px 17px}.suggestion-grid{display:flex;overflow-x:auto;gap:8px;margin-right:-12px;scroll-snap-type:x mandatory}.suggestion-grid > :global(*){flex:0 0 72%;scroll-snap-align:start}.suggestions{margin-top:70px}header p{align-self:flex-end}.shipping-nudge{font-size:11px}
        }
        @media(prefers-reduced-motion:reduce){.shipping-track i{transition:none}}
      `}</style>
    </div>
  );
}
