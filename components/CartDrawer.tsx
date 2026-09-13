"use client";

import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import { useStore } from "@/components/StoreProvider";
import { money } from "@/lib/format";

const FREE_SHIPPING_AT = 999;

export function CartDrawer() {
  const {
    drawerOpen,
    closeCart,
    cartLines,
    cartCount,
    subtotal,
    updateQuantity,
    removeFromCart,
  } = useStore();

  if (!drawerOpen) return null;

  const remainingForShipping = Math.max(0, FREE_SHIPPING_AT - subtotal);

  return (
    <div
      className="drawer-layer cart-drawer-layer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeCart();
      }}
    >
      <aside
        className="drawer cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="drawer-header">
          <div>
            <p className="eyebrow">Your picks</p>
            <h2 id="cart-drawer-title">
              Shopping bag <span>({cartCount})</span>
            </h2>
          </div>
          <button
            className="icon-button drawer-close"
            type="button"
            onClick={closeCart}
            aria-label="Close shopping bag"
            autoFocus
          >
            <X aria-hidden="true" size={22} />
          </button>
        </header>

        {cartLines.length === 0 ? (
          <div className="drawer-empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              <ShoppingBag size={34} />
            </span>
            <h3>Your bag is ready for a first pick</h3>
            <p>
              Start with a fresh graphic, an easy layer, or something built for
              everyday rotation.
            </p>
            <Link className="button button-primary" href="/shop" onClick={closeCart}>
              Explore all styles
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        ) : (
          <>
            <div className="shipping-nudge" aria-live="polite">
              <Truck aria-hidden="true" size={19} />
              <div>
                <p>
                  {remainingForShipping > 0
                    ? `Add ${money(remainingForShipping)} more for free shipping.`
                    : "Nice one — your order ships free."}
                </p>
                <progress
                  aria-label="Progress toward free shipping"
                  max={FREE_SHIPPING_AT}
                  value={Math.min(subtotal, FREE_SHIPPING_AT)}
                />
              </div>
            </div>

            <div className="cart-drawer-lines" aria-label="Bag items">
              {cartLines.map((line) => (
                <article className="cart-line" key={line.key}>
                  <Link
                    className="cart-line-visual"
                    href={`/product/${line.product.slug}`}
                    onClick={closeCart}
                    aria-label={`View ${line.product.name}`}
                  >
                    <span
                      className="cart-line-art"
                      role="img"
                      aria-label={`${line.product.name} in ${line.color.name}`}
                      style={{
                        background: `linear-gradient(145deg, ${line.product.palette[0]}, ${line.product.palette[1]} 58%, ${line.product.palette[2]})`,
                      }}
                    >
                      <span aria-hidden="true">{line.product.art}</span>
                    </span>
                  </Link>

                  <div className="cart-line-details">
                    <div className="cart-line-heading">
                      <div>
                        <p className="cart-line-collection">
                          {line.product.collection}
                        </p>
                        <h3>
                          <Link
                            href={`/product/${line.product.slug}`}
                            onClick={closeCart}
                          >
                            {line.product.name}
                          </Link>
                        </h3>
                      </div>
                      <button
                        className="icon-button cart-line-remove"
                        type="button"
                        onClick={() => removeFromCart(line.key)}
                        aria-label={`Remove ${line.product.name} from bag`}
                      >
                        <Trash2 aria-hidden="true" size={17} />
                      </button>
                    </div>

                    <p className="cart-line-meta">
                      <span
                        className="color-dot"
                        style={{ backgroundColor: line.color.hex }}
                        aria-hidden="true"
                      />
                      {line.color.name} <span aria-hidden="true">·</span> Size {line.size}
                    </p>

                    <div className="cart-line-controls">
                      <div
                        className="quantity-control"
                        aria-label={`Quantity for ${line.product.name}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(line.key, line.quantity - 1)
                          }
                          aria-label={`Decrease ${line.product.name} quantity`}
                        >
                          <Minus aria-hidden="true" size={14} />
                        </button>
                        <output aria-live="polite">{line.quantity}</output>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(line.key, line.quantity + 1)
                          }
                          aria-label={`Increase ${line.product.name} quantity`}
                          disabled={line.quantity >= 10}
                        >
                          <Plus aria-hidden="true" size={14} />
                        </button>
                      </div>
                      <strong className="cart-line-total">
                        {money(line.product.price * line.quantity)}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <footer className="cart-drawer-footer">
              <div className="cart-subtotal-row">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <p className="cart-tax-note">
                Taxes included. Shipping is calculated at checkout.
              </p>
              <Link
                className="button button-primary button-full"
                href="/checkout"
                onClick={closeCart}
              >
                Checkout
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link
                className="button button-secondary button-full"
                href="/cart"
                onClick={closeCart}
              >
                View bag
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;
