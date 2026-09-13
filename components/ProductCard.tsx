"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { useStore } from "@/components/StoreProvider";
import { formatCompactNumber, formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";

export type ProductCardProps = {
  product: Product;
  className?: string;
  compact?: boolean;
};

export function ProductCard({ product, className = "", compact = false }: ProductCardProps) {
  const { toggleWishlist, isWishlisted, quickAdd } = useStore();
  const wishlisted = isWishlisted(product.id);
  const soldOut = product.sizes.every((size) => product.outOfStock.includes(size));
  const statusTag = product.tags.includes("new")
    ? "New"
    : product.tags.includes("bestseller")
      ? "Bestseller"
      : null;

  return (
    <article
      className={`product-card${compact ? " product-card--compact" : ""}${className ? ` ${className}` : ""}`}
      data-product-id={product.id}
    >
      <div className="product-card__media">
        <Link
          href={`/product/${product.slug}`}
          className="product-card__image-link"
          aria-label={`View ${product.name}`}
        >
          <ProductVisual
            product={product}
            className="product-card__visual product-card__visual--front"
          />
          <ProductVisual
            product={product}
            view="back"
            className="product-card__visual product-card__visual--back"
            decorative
          />
        </Link>

        <div className="product-card__badges" aria-label="Product highlights">
          {statusTag ? <span className="product-card__badge product-card__badge--status">{statusTag}</span> : null}
          {product.discount > 0 ? (
            <span className="product-card__badge product-card__badge--discount">
              {product.discount}% off
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className={`product-card__wishlist${wishlisted ? " is-active" : ""}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={wishlisted}
        >
          <Heart aria-hidden="true" fill={wishlisted ? "currentColor" : "none"} />
        </button>

        <button
          type="button"
          className="product-card__quick-add"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            quickAdd(product);
          }}
          disabled={soldOut}
          aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to bag`}
        >
          <span className="quick-add-desktop">{soldOut ? "Sold out" : "Add to bag"}</span>
          <span className="quick-add-mobile">{soldOut ? "Out" : "+ Add"}</span>
        </button>
      </div>

      <div className="product-card__body">
        <Link href={`/collection/${product.collectionSlug}`} className="product-card__collection">
          {product.collection}
        </Link>

        <Link href={`/product/${product.slug}`} className="product-card__title-link">
          <h3 className="product-card__title">{product.name}</h3>
        </Link>

        <div className="product-card__price" aria-label={`${formatINR(product.price)}, ${product.discount}% off`}>
          <strong className="product-card__selling-price">{formatINR(product.price)}</strong>
          {product.price < product.mrp ? (
            <>
              <del className="product-card__mrp">{formatINR(product.mrp)}</del>
              <span className="product-card__saving">{product.discount}% off</span>
            </>
          ) : null}
        </div>

        <div className="product-card__meta">
          <div className="product-card__swatches" role="list" aria-label="Available colours">
            {product.colors.slice(0, compact ? 3 : 4).map((color) => (
              <span
                key={`${product.id}-${color.name}`}
                className="product-card__swatch"
                style={{ backgroundColor: color.hex }}
                role="listitem"
                title={color.name}
              >
                <span className="visually-hidden">{color.name}</span>
              </span>
            ))}
          </div>

          <span className="product-card__rating" aria-label={`${product.rating} out of 5, ${product.reviewCount} reviews`}>
            <Star aria-hidden="true" fill="currentColor" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="product-card__review-count">({formatCompactNumber(product.reviewCount)})</span>
          </span>
        </div>
      </div>
    </article>
  );
}
