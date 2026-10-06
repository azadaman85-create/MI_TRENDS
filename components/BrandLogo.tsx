/**
 * The MI TRENDS logo.
 *
 * Four prepared copies of the same artwork live in public/images: the full lockup and
 * the monogram on its own, each in dark ink for light surfaces and white ink for dark
 * ones. All are trimmed with a transparent background, so they sit on any surface
 * without a visible box. Reach for `mark` only where the full lockup cannot fit — a
 * collapsed rail or a square slot — since it drops the wordmark.
 */

/** Each artwork's own ratio, so the box is reserved before the image loads. */
const RATIO = { full: 1200 / 262, mark: 1 };

const SOURCES = {
  full: { light: "/images/logo.png", dark: "/images/logo-white.png" },
  mark: { light: "/images/logo-mark.png", dark: "/images/logo-mark-white.png" },
};

export function BrandLogo({
  height = 34,
  tone = "light",
  variant = "full",
  className,
  priority = false,
}: {
  /** Rendered height in px; width follows the artwork's own ratio. */
  height?: number;
  /** The surface it sits on, not the colour of the logo. */
  tone?: "light" | "dark";
  /** The full lockup, or the monogram alone where width is tight. */
  variant?: "full" | "mark";
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SOURCES[variant][tone]}
      alt={variant === "mark" ? "MI TRENDS" : "MI TRENDS — Clothing Brand"}
      className={["brand-logo", className].filter(Boolean).join(" ")}
      width={Math.round(height * RATIO[variant])}
      height={height}
      // Loaded eagerly in the header — it's above the fold on every page.
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      // The height goes through a custom property so a media query can shrink the
      // lockup on narrow screens — an inline height would outrank the stylesheet.
      style={
        {
          "--brand-logo-h": `${height}px`,
          height: "var(--brand-logo-h)",
          width: "auto",
          maxWidth: "100%",
          display: "block",
        } as React.CSSProperties
      }
    />
  );
}
