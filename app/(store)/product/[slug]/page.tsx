"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BadgeCheck,
  ChevronDown,
  Heart,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { products } from "@/lib/catalog";
import { ProductVisual } from "@/components/ProductVisual";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/components/StoreProvider";
import { SizeGuide } from "@/components/SizeGuide";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const views = ["Front", "Back", "Fabric detail", "Styled"];

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const product = products.find((item) => item.slug === params.slug);

  if (!product) {
    return (
      <section className="not-found">
        <span>404 · Off the rack</span>
        <h1>This style moved on.</h1>
        <p>It may be sold out or renamed. The newest drop is waiting in the shop.</p>
        <Link href="/shop">Explore all styles</Link>
        <style jsx>{`
          .not-found { min-height: 68vh; display: grid; place-content: center; justify-items: center; text-align: center; padding: 40px 20px; }
          span { color: #e5482b; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; font-weight: 800; }
          h1 { margin: 10px 0; font-size: clamp(42px, 8vw, 88px); line-height: .92; letter-spacing: -.06em; text-transform: uppercase; }
          p { color: #6c6760; }
          a { margin-top: 16px; min-height: 50px; padding: 0 24px; display: inline-flex; align-items: center; background: #171717; color: #fff; text-decoration: none; border-radius: 5px; text-transform: uppercase; font-size: 12px; font-weight: 800; letter-spacing: .07em; }
        `}</style>
      </section>
    );
  }

  return <ProductDetails key={product.id} product={product} />;
}

function ProductDetails({ product }: { product: (typeof products)[number] }) {
  const router = useRouter();
  const store = useStore();
  const [activeView, setActiveView] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes.length === 1 ? product.sizes[0] : "");
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const sizeRef = useRef<HTMLDivElement>(null);

  const recommendations = useMemo(() => {
    const related = products.filter((item) => item.id !== product.id && (item.collection === product.collection || item.type === product.type));
    const fallback = products.filter((item) => item.id !== product.id && !related.includes(item));
    return [...related, ...fallback].slice(0, 4);
  }, [product]);

  const currentColor = product.colors[selectedColor] || product.colors[0];
  const saved = store.isWishlisted(product);

  const ensureSize = () => {
    if (selectedSize) return true;
    setSizeError(true);
    sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  };

  const addToBag = (goToCheckout = false) => {
    if (!ensureSize()) return;
    store.addToCart(product, selectedSize, currentColor, quantity);
    if (goToCheckout) router.push("/checkout");
    else store.openCart();
  };

  const checkDelivery = () => {
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setDeliveryMessage("Enter a valid 6-digit Indian pincode.");
      return;
    }
    const from = new Date();
    from.setDate(from.getDate() + 3 + (Number(pincode.at(-1)) % 2));
    const to = new Date(from);
    to.setDate(to.getDate() + 2);
    const format = (date: Date) => date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    setDeliveryMessage(`Delivery expected between ${format(from)} and ${format(to)}.`);
  };

  return (
    <div className="pdp">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span>
        <Link href={`/shop?category=${product.category}`}>{product.category}</Link><span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="pdp-main">
        <section className="gallery" aria-label="Product gallery">
          <div className="thumbs">
            {views.map((view, index) => {
              const v = index === 0 ? "front" : index === 1 ? "back" : index === 2 ? "detail" : "flat";
              return (
                <button key={view} className={activeView === index ? "active" : ""} type="button" onClick={() => setActiveView(index)} aria-label={`View ${view.toLowerCase()}`}>
                  <ProductVisual product={product} view={v as any} />
                  <span>{view}</span>
                </button>
              );
            })}
          </div>
          <div className={`hero-visual view-${activeView}`}>
            <ProductVisual product={product} view={(activeView === 0 ? "front" : activeView === 1 ? "back" : activeView === 2 ? "detail" : "flat") as any} />
            <span className="view-label">{views[activeView]}</span>
            {product.tags[0] && <span className="product-badge">{product.tags[0]}</span>}
            <button className={`gallery-heart ${saved ? "saved" : ""}`} type="button" onClick={() => store.toggleWishlist(product)} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}>
              <Heart size={20} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
        </section>

        <section className="details">
          <Link className="collection" href={`/shop?collection=${product.collectionSlug}`}>{product.collection}</Link>
          <h1>{product.name}</h1>
          <div className="social-proof">
            <span className="rating"><Star size={13} fill="currentColor" /> {product.rating}</span>
            <span>{product.reviewCount.toLocaleString("en-IN")} reviews</span>
            <i />
            <span className="selling-fast"><Sparkles size={13} /> Selling fast</span>
          </div>

          <div className="price-block">
            <strong>{money.format(product.price)}</strong>
            {product.mrp > product.price && <><del>{money.format(product.mrp)}</del><span>{product.discount}% off</span></>}
          </div>
          <p className="tax-note">Inclusive of all taxes</p>

          <div className="selection-block">
            <div className="selection-label"><strong>Colour</strong><span>{currentColor.name}</span></div>
            <div className="colors" role="radiogroup" aria-label="Choose colour">
              {product.colors.map((color, index) => (
                <button key={color.name} type="button" className={selectedColor === index ? "active" : ""} onClick={() => setSelectedColor(index)} aria-label={color.name} aria-pressed={selectedColor === index}>
                  <span style={{ backgroundColor: color.hex }} />
                </button>
              ))}
            </div>
          </div>

          <div className="selection-block size-block" ref={sizeRef}>
            <div className="selection-label">
              <strong>Select size</strong>
              <button type="button" onClick={() => setSizeGuideOpen(true)}>Size guide</button>
            </div>
            <div className="sizes" role="radiogroup" aria-label="Choose size">
              {product.sizes.map((size) => {
                const unavailable = product.outOfStock.includes(size);
                return (
                  <button key={size} type="button" disabled={unavailable} className={selectedSize === size ? "active" : ""} onClick={() => { setSelectedSize(size); setSizeError(false); }} aria-label={`${size}${unavailable ? ", out of stock" : ""}`}>
                    {size}
                  </button>
                );
              })}
            </div>
            {sizeError && <p className="size-error" role="alert">Choose an available size before adding this style.</p>}
            <p className="fit-note"><BadgeCheck size={14} /> {product.fit}. Most customers stay true to size.</p>
          </div>

          <div className="buy-row">
            <div className="qty" aria-label="Quantity selector">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} /></button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(5, quantity + 1))}><Plus size={16} /></button>
            </div>
            <button className="add" type="button" onClick={() => addToBag(false)}><ShoppingBag size={18} /> Add to bag</button>
            <button className="buy" type="button" onClick={() => addToBag(true)}>Buy now</button>
          </div>

          <div className="delivery-card">
            <div className="delivery-title"><MapPin size={18} /><div><strong>Delivery to your door</strong><span>Check availability and date</span></div></div>
            <div className="pin-row">
              <input inputMode="numeric" maxLength={6} value={pincode} onChange={(event) => { setPincode(event.target.value.replace(/\D/g, "")); setDeliveryMessage(""); }} placeholder="Enter 6-digit pincode" aria-label="Delivery pincode" />
              <button type="button" onClick={checkDelivery}>Check</button>
            </div>
            {deliveryMessage && <p className={deliveryMessage.startsWith("Enter") ? "pin-error" : "pin-success"} aria-live="polite">{deliveryMessage}</p>}
          </div>

          <div className="assurances">
            <span><Truck size={18} /><b>Free shipping</b> over ₹999</span>
            <span><RotateCcw size={18} /><b>30-day returns</b> easy exchange</span>
            <span><ShieldCheck size={18} /><b>Secure checkout</b> 100% protected</span>
          </div>

          <div className="offers">
            <span className="section-kicker">Offers for you</span>
            <article><div><strong>First fit, better price</strong><p>15% off up to ₹400 on orders over ₹999.</p></div><code>FIRST15</code></article>
            <article><div><strong>Stack your wardrobe</strong><p>Flat ₹200 off when your bag crosses ₹1,499.</p></div><code>FLAT200</code></article>
          </div>

          <div className="accordions">
            <details open><summary>Product details <ChevronDown size={17} /></summary><div><p>{product.art} artwork from our {product.collection} studio story, made for repeat wear.</p><dl><div><dt>Fit</dt><dd>{product.fit}</dd></div><div><dt>Fabric</dt><dd>{product.fabric}</dd></div><div><dt>Care</dt><dd>Cold wash inside out. Dry in shade. Do not iron the print.</dd></div><div><dt>Origin</dt><dd>Designed and made in India</dd></div><div><dt>SKU</dt><dd>{product.sku}</dd></div></dl></div></details>
            <details><summary>Shipping & returns <ChevronDown size={17} /></summary><div><p>Dispatches in 1–2 working days. Returns and exchanges are accepted within 30 days when unworn and tagged.</p></div></details>
            <details><summary>Ratings & reviews <span>{product.rating} / 5</span><ChevronDown size={17} /></summary><div><p>Customers love the substantial feel, clean finish and true-to-size shape. Verified-buyer reviews are shown after delivery.</p></div></details>
          </div>
        </section>
      </div>

      <section className="related">
        <div className="related-head"><div><span className="section-kicker">Wear it your way</span><h2>You may also like</h2></div><Link href={`/shop?collection=${product.collectionSlug}`}>View collection</Link></div>
        <div className="related-grid">{recommendations.map((item) => <ProductCard key={item.id} product={item} />)}</div>
      </section>

      <div className="mobile-buy-bar">
        <button
          type="button"
          className={`mobile-buy-wishlist ${saved ? "is-saved" : ""}`}
          onClick={() => store.toggleWishlist(product)}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={20} fill={saved ? "currentColor" : "none"} />
        </button>
        <div className="mobile-buy-info">
          <span className="mobile-buy-price">{money.format(product.price)}</span>
          <small className="mobile-buy-size">{selectedSize ? `Size: ${selectedSize}` : "Select size"}</small>
        </div>
        <button type="button" className="mobile-buy-cta" onClick={() => addToBag(false)}>
          Add to bag
        </button>
      </div>

      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} productType={product.type} />

      <style jsx>{`
        .pdp { width: min(1400px, calc(100% - 48px)); margin: 0 auto; padding: 24px 0 100px; color: #171717; }
        .crumb { display: flex; gap: 8px; align-items: center; color: #7b756e; font-size: 11px; margin-bottom: 24px; white-space: nowrap; overflow: hidden; }
        .crumb a { color: inherit; text-decoration: none; text-transform: capitalize; }
        .crumb span:last-child { text-overflow: ellipsis; overflow: hidden; }
        .pdp-main { display: grid; grid-template-columns: minmax(0, 1.16fr) minmax(390px, .84fr); gap: clamp(34px, 5vw, 78px); align-items: start; }
        .gallery { position: sticky; top: 116px; display: grid; grid-template-columns: 92px minmax(0,1fr); gap: 12px; }
        .thumbs { display: grid; align-content: start; gap: 9px; }
        .thumbs button { position: relative; aspect-ratio: 3/4; overflow: hidden; padding: 0; border: 1px solid transparent; border-radius: 7px; background: #eeeae4; cursor: pointer; }
        .thumbs button.active { border-color: #171717; }
        .thumbs :global(svg) { width: 100%; height: 100%; }
        .thumbs button span { position: absolute; inset: auto 4px 4px; border-radius: 3px; background: rgba(255,255,255,.87); padding: 3px; font-size: 8px; font-weight: 800; text-transform: uppercase; }
        .hero-visual { position: relative; aspect-ratio: 3/4; overflow: hidden; display: grid; place-items: center; border-radius: 10px; background: #eeeae4; }
        .hero-visual :global(svg) { width: 100%; height: 100%; transform: scale(1.01); transition: transform .35s ease, filter .35s ease; }
        .hero-visual.view-1 :global(svg) { transform: scale(1.03) rotateY(180deg); filter: saturate(.85); }
        .hero-visual.view-2 :global(svg) { transform: scale(1.5); }
        .hero-visual.view-3 :global(svg) { transform: scale(.88) rotate(-4deg); }
        .view-label { position: absolute; left: 14px; bottom: 14px; padding: 6px 9px; border-radius: 4px; background: rgba(255,255,255,.88); backdrop-filter: blur(8px); font-size: 9px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        .product-badge { position: absolute; left: 14px; top: 14px; padding: 7px 10px; border-radius: 4px; background: #f6d64a; font-size: 9px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        .gallery-heart { position: absolute; right: 14px; top: 14px; width: 44px; height: 44px; display: grid; place-items: center; border: 0; border-radius: 50%; background: #fff; color: #171717; box-shadow: 0 6px 20px rgba(0,0,0,.09); cursor: pointer; }
        .gallery-heart.saved { color: #e5482b; }
        .details { padding-top: 4px; }
        .collection { color: #e5482b; font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; text-decoration: none; }
        h1 { margin: 9px 0 13px; font-size: clamp(36px, 4.3vw, 62px); line-height: .98; letter-spacing: -.055em; text-transform: uppercase; }
        .social-proof { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; color: #706b64; font-size: 12px; }
        .rating { display: inline-flex; align-items: center; gap: 4px; color: #18663b; font-weight: 800; }
        .social-proof i { width: 1px; height: 14px; background: #ddd8d1; }
        .selling-fast { display: inline-flex; align-items: center; gap: 4px; color: #9b421f; font-weight: 700; }
        .price-block { display: flex; align-items: baseline; flex-wrap: wrap; gap: 9px; margin-top: 25px; }
        .price-block strong { font-size: 26px; letter-spacing: -.03em; }
        .price-block del { color: #8b867f; font-size: 15px; }
        .price-block > span { color: #197343; font-size: 13px; font-weight: 800; }
        .tax-note { margin: 4px 0 0; color: #817b74; font-size: 11px; }
        .selection-block { margin-top: 28px; }
        .selection-label { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 12px; }
        .selection-label strong { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
        .selection-label span { flex: 1; color: #7a756e; font-size: 12px; }
        .selection-label button { border: 0; background: none; color: #e5482b; font-size: 11px; font-weight: 800; text-transform: uppercase; text-decoration: underline; cursor: pointer; }
        .colors { display: flex; gap: 10px; }
        .colors button { width: 37px; height: 37px; padding: 3px; border: 1px solid #d7d3cd; border-radius: 50%; background: #fff; cursor: pointer; }
        .colors button span { display: block; width: 100%; height: 100%; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); }
        .colors button.active { border-color: #171717; box-shadow: 0 0 0 2px #fff, 0 0 0 3px #171717; }
        .sizes { display: flex; flex-wrap: wrap; gap: 8px; }
        .sizes button { position: relative; min-width: 54px; height: 45px; padding: 0 12px; border: 1px solid #d6d2cb; border-radius: 5px; background: #fff; font-weight: 700; cursor: pointer; }
        .sizes button.active { border-color: #171717; background: #171717; color: #fff; }
        .sizes button:disabled { color: #aaa69f; background: linear-gradient(to bottom right, transparent 48%, #d4d0ca 49%, #d4d0ca 51%, transparent 52%); cursor: not-allowed; }
        .size-error { margin: 9px 0 0; color: #c83825; font-size: 12px; font-weight: 700; }
        .fit-note { display: flex; align-items: center; gap: 6px; margin: 11px 0 0; color: #67625c; font-size: 11px; }
        .buy-row { display: grid; grid-template-columns: 106px 1fr .82fr; gap: 9px; margin-top: 27px; }
        .qty { min-height: 52px; display: grid; grid-template-columns: 34px 1fr 34px; align-items: center; border: 1px solid #d6d2cb; border-radius: 5px; }
        .qty button { border: 0; background: none; display: grid; place-items: center; cursor: pointer; }
        .qty span { text-align: center; font-size: 13px; font-weight: 800; }
        .buy-row > button { min-height: 52px; border-radius: 5px; font-size: 11px; font-weight: 900; letter-spacing: .07em; text-transform: uppercase; cursor: pointer; }
        .add { display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #171717; background: #171717; color: #fff; }
        .buy { border: 1px solid #e5482b; background: #e5482b; color: #fff; }
        .delivery-card { margin-top: 28px; padding: 18px; border: 1px solid #ddd9d2; border-radius: 8px; }
        .delivery-title { display: flex; align-items: center; gap: 10px; }
        .delivery-title div { display: grid; gap: 2px; }
        .delivery-title strong { font-size: 13px; }
        .delivery-title span { color: #7b756e; font-size: 11px; }
        .pin-row { display: flex; margin-top: 14px; border-bottom: 1px solid #171717; }
        .pin-row input { min-width: 0; flex: 1; height: 42px; border: 0; background: transparent; font: inherit; font-size: 13px; outline: none; }
        .pin-row button { border: 0; background: transparent; color: #e5482b; font-size: 11px; font-weight: 900; text-transform: uppercase; cursor: pointer; }
        .pin-success, .pin-error { margin: 10px 0 0; font-size: 11px; font-weight: 700; }
        .pin-success { color: #16703f; } .pin-error { color: #c83825; }
        .assurances { display: grid; grid-template-columns: repeat(3,1fr); margin-top: 20px; border: 1px solid #e1ddd7; border-radius: 8px; }
        .assurances span { min-width: 0; display: grid; justify-items: center; gap: 5px; padding: 14px 8px; text-align: center; color: #78726b; font-size: 9px; }
        .assurances span + span { border-left: 1px solid #e1ddd7; }
        .assurances b { display: block; color: #272421; font-size: 10px; }
        .offers { margin-top: 32px; }
        .section-kicker { color: #e5482b; font-size: 10px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
        .offers article { display: flex; justify-content: space-between; align-items: center; gap: 18px; padding: 15px 0; border-bottom: 1px solid #e1ddd7; }
        .offers article strong { font-size: 12px; }
        .offers article p { margin: 3px 0 0; color: #77716b; font-size: 11px; line-height: 1.45; }
        .offers code { border: 1px dashed #d8a56d; border-radius: 4px; background: #fff8e8; color: #7f491d; padding: 6px 8px; font: 800 10px/1 inherit; }
        .accordions { margin-top: 25px; border-top: 1px solid #dcd8d1; }
        .accordions details { border-bottom: 1px solid #dcd8d1; }
        .accordions summary { min-height: 58px; display: flex; align-items: center; gap: 9px; list-style: none; cursor: pointer; font-size: 12px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; }
        .accordions summary::-webkit-details-marker { display: none; }
        .accordions summary > span { margin-left: auto; color: #1a7042; }
        .accordions summary > :global(svg) { margin-left: auto; }
        .accordions summary > span + :global(svg) { margin-left: 0; }
        .accordions details[open] summary > :global(svg) { transform: rotate(180deg); }
        .accordions details > div { padding: 0 0 20px; color: #68635c; font-size: 12px; line-height: 1.65; }
        .accordions details p { margin: 0; }
        dl { margin: 15px 0 0; }
        dl div { display: grid; grid-template-columns: 100px 1fr; gap: 10px; padding: 7px 0; }
        dt { color: #272421; font-weight: 800; } dd { margin: 0; }
        .related { margin-top: 100px; padding-top: 48px; border-top: 1px solid #dedad3; }
        .related-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
        .related h2 { margin: 6px 0 0; font-size: clamp(30px, 4vw, 50px); line-height: .95; text-transform: uppercase; letter-spacing: -.05em; }
        .related-head a { color: #171717; font-size: 11px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; text-underline-offset: 4px; }
        .related-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px; }
        .mobile-buy-bar { display: none; }
        button:focus-visible, input:focus-visible, summary:focus-visible, a:focus-visible { outline: 3px solid #f3a078; outline-offset: 3px; }
        @media (max-width: 1100px) { .pdp-main { grid-template-columns: minmax(0,1fr) minmax(360px,.9fr); gap: 32px; } .gallery { grid-template-columns: 72px minmax(0,1fr); } }
        @media (max-width: 850px) {
          .pdp { width: min(100% - 32px, 720px); }
          .pdp-main { display: block; }
          .gallery { position: relative; top: auto; grid-template-columns: 1fr; }
          .hero-visual { grid-row: 1; }
          .thumbs { grid-row: 2; grid-template-columns: repeat(4,1fr); gap: 8px; }
          .details { padding-top: 38px; }
          .related { margin-top: 70px; }
        }
        @media (max-width: 620px) {
          .pdp { width: calc(100% - 24px); padding-top: 15px; padding-bottom: 120px; }
          .crumb { margin-bottom: 14px; }
          .thumbs button span { display: none; }
          .details { padding-top: 28px; }
          .buy-row { grid-template-columns: 96px 1fr; }
          .buy-row .buy { display: none; }
          .assurances { grid-template-columns: 1fr; }
          .assurances span { grid-template-columns: 24px auto; justify-items: start; text-align: left; align-items: center; }
          .assurances span + span { border-left: 0; border-top: 1px solid #e1ddd7; }
          .assurances b { display: inline; margin-right: 3px; }
          .related-grid { display: flex; gap: 9px; overflow-x: auto; scroll-snap-type: x mandatory; margin-right: -12px; scrollbar-width: none; }
          .related-grid > :global(*) { flex: 0 0 72%; scroll-snap-align: start; }
          .mobile-buy-bar { position: fixed; inset: auto 0 0; z-index: 40; display: grid; grid-template-columns: 46px minmax(0, 1fr) 1.2fr; align-items: center; gap: 12px; min-height: 66px; padding: 8px max(14px, env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left)); border-top: 1px solid #dcd8d1; background: rgba(255,255,255,.96); backdrop-filter: blur(16px); box-shadow: 0 -4px 20px rgba(0,0,0,.08); }
          .mobile-buy-wishlist { width: 44px; height: 44px; border-radius: 50%; border: 1px solid #d9d5ce; background: #f7f5f0; display: grid; place-items: center; color: #171717; cursor: pointer; transition: transform .15s ease, color .15s ease; }
          .mobile-buy-wishlist:active { transform: scale(0.9); }
          .mobile-buy-wishlist.is-saved { color: #e5482b; border-color: #e5482b; background: #fff0ed; }
          .mobile-buy-info { display: grid; min-width: 0; line-height: 1.2; }
          .mobile-buy-price { font-size: 17px; font-weight: 900; letter-spacing: -.02em; }
          .mobile-buy-size { color: #79736c; font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .mobile-buy-cta { min-height: 48px; border: 0; border-radius: 6px; background: #171717; color: #fff; font-size: 12px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; cursor: pointer; transition: transform .15s ease, background .15s ease; }
          .mobile-buy-cta:active { transform: scale(0.96); }
        }
        @media (prefers-reduced-motion: reduce) { .hero-visual :global(svg) { transition: none; } }
      `}</style>
    </div>
  );
}
