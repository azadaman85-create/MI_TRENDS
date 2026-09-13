"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  WalletCards,
} from "lucide-react";
import { products } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/components/StoreProvider";

const heroSlides = [
  {
    kicker: "EVERYDAY ICONS",
    title: "THE TEE YOU\nREACH FOR FIRST.",
    copy: "Combed cotton, honest cuts and colours that survive the wash pile. Built for every day.",
    cta: "Shop men's tees",
    href: "/shop?category=men&type=t-shirt",
    palette: ["#ff4d28", "#ffcf3f", "#1c1817"],
    word: "01",
    image: "/images/products/tee-01-a.jpg",
  },
  {
    kicker: "SOFT NIGHTS",
    title: "SLEEPWEAR WORTH\nSTAYING IN FOR.",
    copy: "Brushed flannel, cotton check and washed satin — pyjama sets cut loose and finished properly.",
    cta: "Shop pyjama sets",
    href: "/shop?category=women",
    palette: ["#f0c5cd", "#8a4a5c", "#fdf6f3"],
    word: "PJ",
    image: "/images/products/pj-01-a.jpg",
  },
  {
    kicker: "THE SHIRT EDIT",
    title: "SHARP WITHOUT\nTHE STIFFNESS.",
    copy: "Poplin and fine stripes that work at a desk, a dinner or anywhere in between.",
    cta: "Shop shirts",
    href: "/shop?type=shirt",
    palette: ["#b8d7ff", "#123f8e", "#f8f5ec"],
    word: "SH",
    image: "/images/products/shirt-01-a.jpg",
  },
] as const;

const homeCategories = [
  { label: "T-shirts", symbol: "TEE", href: "/shop?type=t-shirt", tone: "blue", image: "/images/products/tee-03-a.jpg" },
  { label: "Shirts", symbol: "SHT", href: "/shop?type=shirt", tone: "lime", image: "/images/products/shirt-02-a.jpg" },
  { label: "Pyjama sets", symbol: "PJS", href: "/shop?type=pyjama-set", tone: "pink", image: "/images/products/pj-05-a.jpg" },
  { label: "Men", symbol: "MEN", href: "/shop?category=men", tone: "peach", image: "/images/products/tee-01-a.jpg" },
  { label: "Women", symbol: "WMN", href: "/shop?category=women", tone: "lilac", image: "/images/products/pj-03-a.jpg" },
  { label: "On sale", symbol: "SLE", href: "/shop?tag=sale", tone: "red", image: "/images/products/pj-01-a.jpg" },
] as const;

const editorials = [
  {
    overline: "Everyday Icons",
    title: "TEES, SORTED",
    copy: "Combed cotton in the three colours you actually wear.",
    href: "/shop?type=t-shirt",
    className: "editorial-card--orange",
    art: "TEE",
    image: "/images/products/tee-02-a.jpg",
  },
  {
    overline: "Everyday Icons",
    title: "SHIRT SEASON",
    copy: "Poplin and fine stripes, sharp without the stiffness.",
    href: "/shop?type=shirt",
    className: "editorial-card--blue",
    art: "SHT",
    image: "/images/products/shirt-02-a.jpg",
  },
  {
    overline: "Soft Nights",
    title: "STAY IN CLUB",
    copy: "Flannel, check and satin sets for very serious lounging.",
    href: "/shop?type=pyjama-set",
    className: "editorial-card--green",
    art: "PJS",
    image: "/images/products/pj-02-a.jpg",
  },
] as const;

const collectionTiles = [
  ["Everyday Icons", "Tees and shirts, sorted.", "/shop?collection=everyday-icons", "collection-tile--ink"],
  ["Soft Nights", "Pyjama sets for slow mornings.", "/shop?collection=soft-nights", "collection-tile--pink"],
  ["The Men's Edit", "Every men's piece in one place.", "/shop?category=men", "collection-tile--blue"],
  ["The Women's Edit", "Every women's piece in one place.", "/shop?category=women", "collection-tile--lime"],
] as const;

function HeroArtwork({ slide }: { slide: (typeof heroSlides)[number] }) {
  return (
    <div className="hero-art-media">
      <div className="hero-art-frame">
        <img
          src={slide.image}
          alt={slide.title.replace("\n", " ")}
          className="hero-art-img"
          referrerPolicy="no-referrer"
        />
        <div className="hero-art-badge">
          <span className="hero-art-badge__num">{slide.word}</span>
          <span className="hero-art-badge__sub">MI TRENDS</span>
        </div>
        <div className="hero-art-tag">
          <span>ORIGINAL STREETWEAR</span>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, href, linkLabel = "View all" }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="text-link">
          {linkLabel} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const { showToast } = useStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState<"trending" | "new" | "deals" | "shirts">("trending");
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const touchStart = useRef<number | null>(null);

  const trending = useMemo(() => [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 9), []);
  const newDrops = useMemo(() => products.filter((product) => product.tags.includes("new")).slice(0, 8), []);
  const deals = useMemo(() => {
    const under = products.filter((product) => product.price <= 799);
    return (under.length >= 6 ? under : [...products].sort((a, b) => a.price - b.price)).slice(0, 9);
  }, []);
  const shirts = useMemo(() => products.filter((product) => product.type === "Shirt").slice(0, 8), []);

  const activeFeedProducts = useMemo(() => {
    switch (activeFeedTab) {
      case "new":
        return newDrops;
      case "deals":
        return deals;
      case "shirts":
        return shirts;
      case "trending":
      default:
        return trending.slice(0, 8);
    }
  }, [activeFeedTab, newDrops, deals, shirts, trending]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % heroSlides.length), 5500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const moveSlide = (direction: number) => {
    setActiveSlide((current) => (current + direction + heroSlides.length) % heroSlides.length);
  };

  const handleCopyCoupon = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(true);
      showToast(`Coupon code "${code}" copied to clipboard!`);
      setTimeout(() => setCopiedCoupon(false), 2200);
    }
  };

  return (
    <>
      {/* Mobile-first Stories / Category Capsules */}
      <section className="mobile-story-strip" aria-label="Browse categories">
        <div className="mobile-story-rail">
          {homeCategories.map((category) => (
            <Link href={category.href} className="mobile-story-item" key={category.label}>
              <span className={`mobile-story-avatar mobile-story-avatar--${category.tone}`} aria-hidden="true">
                <img src={category.image} alt={category.label} className="mobile-story-photo" referrerPolicy="no-referrer" />
              </span>
              <span className="mobile-story-label">{category.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Hero Carousel */}
      <section
        className="hero"
        aria-roledescription="carousel"
        aria-label="Featured collections"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
          if (Math.abs(delta) > 50) moveSlide(delta > 0 ? -1 : 1);
          touchStart.current = null;
        }}
      >
        <div className="hero-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
          {heroSlides.map((slide, index) => (
            <article
              className="hero-slide"
              key={slide.title}
              aria-hidden={activeSlide !== index}
              style={{ "--hero-main": slide.palette[0], "--hero-accent": slide.palette[1], "--hero-ink": slide.palette[2] } as React.CSSProperties}
            >
              <div className="hero-copy">
                <p className="hero-kicker"><Sparkles size={15} aria-hidden="true" /> {slide.kicker}</p>
                <h1>{slide.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
                <p>{slide.copy}</p>
                <Link href={slide.href} className="button button--ink" tabIndex={activeSlide === index ? 0 : -1}>
                  {slide.cta} <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
              <div className="hero-art"><HeroArtwork slide={slide} /></div>
            </article>
          ))}
        </div>
        <button type="button" className="hero-arrow hero-arrow--prev" onClick={() => moveSlide(-1)} aria-label="Previous hero slide"><ChevronLeft /></button>
        <button type="button" className="hero-arrow hero-arrow--next" onClick={() => moveSlide(1)} aria-label="Next hero slide"><ChevronRight /></button>
        <div className="hero-dots" role="tablist" aria-label="Choose a hero slide">
          {heroSlides.map((slide, index) => (
            <button key={slide.kicker} type="button" role="tab" aria-selected={activeSlide === index} aria-label={`Show slide ${index + 1}`} onClick={() => setActiveSlide(index)}>
              <span style={{ transform: activeSlide === index && !paused ? "scaleX(1)" : "scaleX(0)" }} />
            </button>
          ))}
        </div>
      </section>

      {/* Mobile In-App Coupon Ticker */}
      <div className="mobile-coupon-strip shell">
        <button
          type="button"
          className="mobile-coupon-btn"
          onClick={() => handleCopyCoupon("MI10")}
          aria-label="Copy coupon code MI10 for 10% off"
        >
          <span className="mobile-coupon-tag">
            <Tag size={15} aria-hidden="true" />
            <span>EXTRA 10% OFF · CODE: <b>MI10</b></span>
          </span>
          <span className="mobile-coupon-action">
            {copiedCoupon ? (
              <>
                <Check size={14} aria-hidden="true" /> COPIED
              </>
            ) : (
              <>
                <Copy size={14} aria-hidden="true" /> TAP TO COPY
              </>
            )}
          </span>
        </button>
      </div>

      {/* Mobile Interactive Feed Tabs */}
      <section className="mobile-feed-section shell" aria-label="Quick browse styles">
        <div className="mobile-feed-tabs" role="tablist" aria-label="Product categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeFeedTab === "trending"}
            className={`mobile-feed-tab ${activeFeedTab === "trending" ? "is-active" : ""}`}
            onClick={() => setActiveFeedTab("trending")}
          >
            🔥 Trending
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFeedTab === "new"}
            className={`mobile-feed-tab ${activeFeedTab === "new" ? "is-active" : ""}`}
            onClick={() => setActiveFeedTab("new")}
          >
            ✨ New Drops
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFeedTab === "deals"}
            className={`mobile-feed-tab ${activeFeedTab === "deals" ? "is-active" : ""}`}
            onClick={() => setActiveFeedTab("deals")}
          >
            🏷️ Under ₹799
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFeedTab === "shirts"}
            className={`mobile-feed-tab ${activeFeedTab === "shirts" ? "is-active" : ""}`}
            onClick={() => setActiveFeedTab("shirts")}
          >
            👔 Shirts
          </button>
        </div>

        <div className="product-grid product-grid--mobile-feed">
          {activeFeedProducts.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>

        <div className="mobile-view-all-wrap">
          <Link href="/shop" className="mobile-view-all-btn">
            Explore all styles in shop <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Desktop Category Rail */}
      <section className="page-shell home-section category-section desktop-only-section" aria-labelledby="category-title">
        <SectionHeading eyebrow="Find your thing" title="SHOP BY CATEGORY" href="/shop" />
        <div className="category-rail" id="category-title">
          {homeCategories.map((category) => (
            <Link href={category.href} className="category-bubble" key={category.label}>
              <span className={`category-bubble__art category-bubble__art--${category.tone}`} aria-hidden="true">
                <img src={category.image} alt={category.label} className="category-bubble__photo" referrerPolicy="no-referrer" />
              </span>
              <strong>{category.label}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-shell home-section">
        <SectionHeading eyebrow="Crowd favourites" title="TRENDING RIGHT NOW" href="/shop?sort=popular" />
        <div className="product-rail">
          {trending.map((product) => <ProductCard product={product} key={product.id} />)}
        </div>
      </section>

      <section className="page-shell home-section">
        <div className="editorial-grid">
          {editorials.map((editorial) => (
            <Link href={editorial.href} className={`editorial-card ${editorial.className}`} key={editorial.title}>
              <img src={editorial.image} alt={editorial.title} className="editorial-card__bg-image" referrerPolicy="no-referrer" />
              <div className="editorial-card__art" aria-hidden="true">
                <span>{editorial.art}</span>
                <i /><b />
              </div>
              <div className="editorial-card__copy">
                <p>{editorial.overline}</p>
                <h3>{editorial.title}</h3>
                <span>{editorial.copy} <ArrowRight size={17} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-shell home-section">
        <SectionHeading eyebrow="Just landed" title="NEW DROPS" href="/shop?sort=newest" linkLabel="Shop new" />
        <div className="product-grid product-grid--home">
          {newDrops.map((product) => <ProductCard product={product} key={product.id} />)}
        </div>
      </section>

      <section className="usp-strip" aria-label="Shopping benefits">
        <div className="page-shell usp-strip__inner">
          <div><Truck aria-hidden="true" /><span><strong>Free shipping</strong><small>On orders above ₹999</small></span></div>
          <div><RotateCcw aria-hidden="true" /><span><strong>Easy returns</strong><small>30 days, no drama</small></span></div>
          <div><WalletCards aria-hidden="true" /><span><strong>Pay your way</strong><small>UPI, cards & COD</small></span></div>
          <div><ShieldCheck aria-hidden="true" /><span><strong>Secure checkout</strong><small>Protected every time</small></span></div>
        </div>
      </section>

      <section className="page-shell home-section">
        <SectionHeading eyebrow="Big mood, small price" title="UNDER ₹799" href="/shop?maxPrice=799" />
        <div className="product-rail">
          {deals.map((product) => <ProductCard product={product} key={product.id} compact />)}
        </div>
      </section>

      <section className="page-shell home-section home-section--last">
        <SectionHeading eyebrow="Two worlds. One wardrobe." title="SHOP THE EDITS" href="/shop" />
        <div className="collection-grid">
          {collectionTiles.map(([title, copy, href, tone], index) => (
            <Link href={href} className={`collection-tile ${tone}`} key={title}>
              <span className="collection-tile__index">0{index + 1}</span>
              <div className="collection-tile__motif" aria-hidden="true"><i /><b /><em /></div>
              <div><h3>{title}</h3><p>{copy}</p></div>
              <ArrowRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
