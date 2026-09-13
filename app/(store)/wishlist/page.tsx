"use client";

import Link from "next/link";
import { ArrowRight, Heart, ShoppingBag, Sparkles } from "lucide-react";
import { products } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/components/StoreProvider";

export default function WishlistPage() {
  const store = useStore();
  const savedProducts = products.filter((product) => store.wishlistIds.includes(product.id));

  if (!savedProducts.length) {
    return (
      <div className="wishlist-empty">
        <div className="heart"><Heart size={31} /></div>
        <span>Keep an eye on it</span>
        <h1>Your wishlist is open.</h1>
        <p>Tap the heart on any piece you love. We’ll keep your shortlist together while you decide.</p>
        <Link href="/shop">Find your favourites <ArrowRight size={16} /></Link>
        <div className="ideas"><Sparkles size={16} /><span>Fresh drops, standout graphics, zero pressure.</span></div>
        <style jsx>{`
          .wishlist-empty { width:min(700px,calc(100% - 32px)); min-height:69vh; margin:auto; display:grid; place-content:center; justify-items:center; padding:60px 0 90px; text-align:center; color:#171717; }
          .heart { width:76px;height:76px;display:grid;place-items:center;border-radius:50%;background:#f2eeea;color:#e5482b; }
          .wishlist-empty > span { margin-top:19px;color:#e5482b;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase; }
          h1 { margin:9px 0 12px;font-size:clamp(42px,8vw,78px);line-height:.92;letter-spacing:-.06em;text-transform:uppercase; }
          p { max-width:520px;margin:0;color:#716b64;line-height:1.65; }
          a { min-height:51px;margin-top:25px;padding:0 24px;display:inline-flex;align-items:center;gap:9px;border-radius:5px;background:#171717;color:#fff;text-decoration:none;font-size:11px;font-weight:900;letter-spacing:.07em;text-transform:uppercase; }
          .ideas { display:flex;align-items:center;gap:7px;margin-top:28px;color:#77716a;font-size:11px; }
          .ideas span{margin:0;color:inherit;font:inherit;letter-spacing:0;text-transform:none}
        `}</style>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <header>
        <div><span>Saved for later</span><h1>Your wishlist</h1><p>{savedProducts.length} {savedProducts.length === 1 ? "style" : "styles"} worth another look.</p></div>
        <Link href="/shop">Keep exploring <ArrowRight size={15} /></Link>
      </header>

      <div className="wishlist-note"><Heart size={16} fill="currentColor" /><p>Your saved pieces live here for this visit. Add a size from the product page when you’re ready.</p></div>

      <section className="wishlist-grid" aria-label="Saved products">
        {savedProducts.map((product) => (
          <div className="saved-card" key={product.id}>
            <ProductCard product={product} />
            <div className="saved-actions">
              <Link href={`/product/${product.slug}`}><ShoppingBag size={14} />Choose options</Link>
              <button type="button" onClick={() => store.toggleWishlist(product)}>Remove</button>
            </div>
          </div>
        ))}
      </section>

      <style jsx>{`
        .wishlist-page{width:min(1320px,calc(100% - 48px));margin:0 auto;padding:48px 0 100px;color:#171717}
        header{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding-bottom:28px;border-bottom:1px solid #ddd9d2}
        header span{color:#e5482b;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
        h1{margin:7px 0 9px;font-size:clamp(44px,6vw,76px);line-height:.92;letter-spacing:-.06em;text-transform:uppercase}
        header p{margin:0;color:#716b64;font-size:13px}
        header a{display:inline-flex;align-items:center;gap:8px;color:#171717;font-size:10px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;text-underline-offset:5px}
        .wishlist-note{display:flex;align-items:center;gap:9px;margin:18px 0 28px;padding:12px 14px;border-radius:6px;background:#f2efea;color:#e5482b}
        .wishlist-note p{margin:0;color:#625d57;font-size:11px}
        .wishlist-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:34px 14px}
        .saved-card{min-width:0}
        .saved-actions{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:11px}
        .saved-actions a,.saved-actions button{min-height:43px;display:flex;align-items:center;justify-content:center;gap:7px;border-radius:5px;font-size:9px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
        .saved-actions a{padding:0 10px;background:#171717;color:#fff;text-decoration:none}.saved-actions button{padding:0 13px;border:1px solid #d8d4ce;background:#fff;color:#625d57}
        button:focus-visible,a:focus-visible{outline:3px solid #f2a078;outline-offset:3px}
        @media(max-width:1050px){.wishlist-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:700px){.wishlist-page{width:calc(100% - 24px);padding-top:30px}.wishlist-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:28px 8px}header{align-items:flex-start;flex-direction:column}header a{align-self:flex-end}.saved-actions{grid-template-columns:1fr}.saved-actions button{min-height:34px;border:0}.wishlist-note{align-items:flex-start}}
      `}</style>
    </div>
  );
}
