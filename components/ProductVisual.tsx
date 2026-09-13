import type { Product, ProductColor } from "@/lib/types";

export type ProductVisualVariant = "front" | "back" | "detail" | "flat" | "flat-lay";

export type ProductVisualProps = {
  product: Product;
  variant?: ProductVisualVariant;
  view?: ProductVisualVariant;
  color?: ProductColor | string;
  className?: string;
  title?: string;
  decorative?: boolean;
  priority?: boolean;
};

type ArtProps = {
  product: Product;
  back?: boolean;
  x?: number;
  y?: number;
  scale?: number;
};

function CollectionArtwork({ product, back = false, x = 240, y = 306, scale = 1 }: ArtProps) {
  const [ink, accent, paper] = product.palette;
  const transform = `translate(${x} ${y}) scale(${scale})`;

  if (back) {
    return (
      <g transform={transform} textAnchor="middle">
        <circle r="51" fill={paper} opacity=".92" />
        <circle r="44" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="5 5" />
        <text y="-5" fill={ink} fontSize="24" fontWeight="900" letterSpacing="2">
          MI
        </text>
        <text y="16" fill={ink} fontSize="8" fontWeight="800" letterSpacing="2.8">
          TRENDS
        </text>
        <path d="M-24 28H24" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      </g>
    );
  }

  switch (product.collectionSlug) {
    case "midnight-metro":
      return (
        <g transform={transform}>
          <path d="M-58 39L-24-28 9 9 47-48" fill="none" stroke={paper} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="-58" cy="39" r="9" fill={accent} stroke={ink} strokeWidth="3" />
          <circle cx="-24" cy="-28" r="9" fill={accent} stroke={ink} strokeWidth="3" />
          <circle cx="9" cy="9" r="9" fill={accent} stroke={ink} strokeWidth="3" />
          <circle cx="47" cy="-48" r="9" fill={accent} stroke={ink} strokeWidth="3" />
          <rect x="-48" y="50" width="96" height="23" rx="3" fill={ink} />
          <text x="0" y="66" fill={paper} fontSize="10" textAnchor="middle" fontWeight="900" letterSpacing="2">LAST LOCAL</text>
        </g>
      );
    case "desi-frequency":
      return (
        <g transform={transform}>
          {[0, 1, 2, 3, 4].map((line) => (
            <path
              key={line}
              d={`M-64 ${-36 + line * 18} C-35 ${-58 + line * 14}, -15 ${-4 + line * 13}, 8 ${-29 + line * 17} S43 ${-4 + line * 12}, 64 ${-30 + line * 18}`}
              fill="none"
              stroke={line % 2 ? paper : accent}
              strokeWidth="7"
              strokeLinecap="round"
            />
          ))}
          <circle r="19" fill={ink} />
          <circle r="7" fill={paper} />
        </g>
      );
    case "cosmic-picnic":
      return (
        <g transform={transform}>
          <ellipse rx="67" ry="24" fill="none" stroke={paper} strokeWidth="8" transform="rotate(-18)" />
          <ellipse rx="61" ry="22" fill="none" stroke={accent} strokeWidth="5" transform="rotate(52)" />
          <circle r="28" fill={accent} stroke={ink} strokeWidth="5" />
          <circle cx="48" cy="-42" r="9" fill={paper} />
          <path d="M-53-49l5 11 12 2-9 8 2 12-10-6-11 6 3-12-9-8 12-2z" fill={paper} />
        </g>
      );
    case "monsoon-club":
      return (
        <g transform={transform}>
          <path d="M-72-27C-45-67 43-67 72-27C45-35-40-35-72-27Z" fill={paper} stroke={ink} strokeWidth="4" />
          <path d="M0-30V44c0 23 30 23 30 1" fill="none" stroke={paper} strokeWidth="9" strokeLinecap="round" />
          <path d="M-55 6l-9 20M-22 10l-10 28M25 7L15 31M57 4L45 27" stroke={accent} strokeWidth="7" strokeLinecap="round" />
          <path d="M-58 56Q0 30 58 56Q0 80-58 56Z" fill={accent} opacity=".9" />
        </g>
      );
    case "analog-arcade":
      return (
        <g transform={transform} shapeRendering="crispEdges">
          <path d="M-64-52H-15V-35H15V-52H64V35H45V55H18V35H-18V55H-45V35H-64Z" fill={ink} stroke={paper} strokeWidth="5" />
          <rect x="-39" y="-22" width="18" height="18" fill={accent} />
          <rect x="21" y="-22" width="18" height="18" fill={accent} />
          <rect x="-20" y="14" width="40" height="10" fill={paper} />
          <rect x="-70" y="70" width="140" height="15" fill={accent} />
        </g>
      );
    case "sunday-service":
      return (
        <g transform={transform}>
          <path d="M-69 32A69 69 0 011-37 69 69 0 0169 32Z" fill={accent} stroke={paper} strokeWidth="6" />
          {[-54, -27, 0, 27, 54].map((xOffset) => (
            <path key={xOffset} d={`M${xOffset} -49V-71`} stroke={paper} strokeWidth="7" strokeLinecap="round" />
          ))}
          <path d="M-76 33H76M-61 50H61M-42 67H42" stroke={paper} strokeWidth="7" strokeLinecap="round" />
          <text x="0" y="4" fill={ink} fontSize="13" textAnchor="middle" fontWeight="900" letterSpacing="3">SLOW DOWN</text>
        </g>
      );
    case "after-hours-athletics":
      return (
        <g transform={transform}>
          <path d="M-64-59H64V59H-64Z" fill={paper} stroke={ink} strokeWidth="5" transform="rotate(-4)" />
          <path d="M-54 0H54M0-49V49" stroke={accent} strokeWidth="5" />
          <circle r="42" fill="none" stroke={accent} strokeWidth="5" />
          <text x="0" y="17" fill={ink} fontSize="47" textAnchor="middle" fontWeight="950" letterSpacing="-3">99</text>
          <path d="M-43 71H43" stroke={paper} strokeWidth="9" strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g transform={transform}>
          <rect x="-65" y="-55" width="130" height="110" rx="8" fill={paper} stroke={ink} strokeWidth="5" transform="rotate(-3)" />
          <text x="0" y="-12" fill={ink} fontSize="15" textAnchor="middle" fontWeight="900" letterSpacing="3">STUDIO</text>
          <text x="0" y="28" fill={accent} fontSize="48" textAnchor="middle" fontWeight="950" letterSpacing="-3">99</text>
          <circle cx="-55" cy="-45" r="10" fill={accent} />
          <circle cx="56" cy="45" r="7" fill={ink} />
        </g>
      );
  }
}

function ProductShape({ product, fill, variant }: { product: Product; fill: string; variant: ProductVisualVariant }) {
  const type = product.type.toLowerCase();
  const isBack = variant === "back";
  const seam = product.palette[2];
  const outline = "#171717";
  const art = (x?: number, y?: number, scale?: number) => (
    <CollectionArtwork product={product} back={isBack} x={x} y={y} scale={scale} />
  );

  if (type.includes("sneaker")) {
    return (
      <g>
        <path d="M81 394c46-8 91-40 119-79l45 31c28 20 63 34 108 40l53 7c21 3 34 19 31 38-3 21-21 34-47 34H105c-36 0-51-17-46-41 3-14 10-25 22-30Z" fill={fill} stroke={outline} strokeWidth="6" strokeLinejoin="round" />
        <path d="M62 426c83 13 272 7 374-2v28c-60 16-302 18-371 3-12-3-14-23-3-29Z" fill={seam} stroke={outline} strokeWidth="5" />
        <path d="M190 330l93 69M212 317l91 68M236 331l-29 51M263 347l-28 51" fill="none" stroke={seam} strokeWidth="8" strokeLinecap="round" />
        <path d="M335 388c27 4 52 7 77 9" stroke={seam} strokeWidth="6" strokeLinecap="round" />
        {art(329, 409, 0.42)}
      </g>
    );
  }

  if (type.includes("backpack")) {
    return (
      <g>
        <path d="M166 216c0-68 148-68 148 0" fill="none" stroke={outline} strokeWidth="18" />
        <path d="M126 265c0-42 34-76 76-76h76c42 0 76 34 76 76v229c0 23-19 42-42 42H168c-23 0-42-19-42-42Z" fill={fill} stroke={outline} strokeWidth="6" />
        <path d="M127 301c-25 13-36 41-36 82v120M353 301c25 13 36 41 36 82v120" fill="none" stroke={outline} strokeWidth="13" strokeLinecap="round" />
        <path d="M153 409c51-22 123-22 174 0v86H153Z" fill="#000" opacity=".15" stroke={outline} strokeWidth="4" />
        <path d="M159 278h162" stroke={seam} strokeWidth="8" strokeLinecap="round" />
        {art(240, 338, 0.75)}
      </g>
    );
  }

  if (type.includes("cap")) {
    return (
      <g>
        <path d="M127 376c4-103 58-158 138-151 73 7 116 63 105 154Z" fill={fill} stroke={outline} strokeWidth="6" />
        <path d="M371 376c52 1 83 18 85 41 3 27-53 37-109 12-33-15-66-30-114-30-61 0-115 23-153 4 58-29 122-31 291-27Z" fill={seam} stroke={outline} strokeWidth="6" />
        <path d="M261 231c-5 44-2 91 13 142" fill="none" stroke={outline} strokeWidth="4" opacity=".55" />
        {art(239, 322, 0.48)}
      </g>
    );
  }

  if (type.includes("sock")) {
    return (
      <g>
        <path d="M153 162h121v239c0 26-10 45-33 58l-88 52c-39 23-83 12-98-17-15-30 1-62 34-76l64-28Z" fill={fill} stroke={outline} strokeWidth="6" />
        <path d="M149 181h129v55H149Z" fill={seam} stroke={outline} strokeWidth="5" />
        <path d="M205 395c-7 37 11 63 44 72" fill="none" stroke={outline} strokeWidth="4" opacity=".4" />
        {art(214, 315, 0.56)}
      </g>
    );
  }

  if (type.includes("phone")) {
    return (
      <g>
        <rect x="139" y="115" width="202" height="412" rx="35" fill={fill} stroke={outline} strokeWidth="8" />
        <rect x="158" y="136" width="78" height="104" rx="24" fill="#111" opacity=".82" />
        <circle cx="183" cy="167" r="15" fill={seam} />
        <circle cx="215" cy="198" r="15" fill={seam} />
        <circle cx="215" cy="165" r="7" fill={product.palette[1]} />
        {art(240, 352, 0.94)}
        <path d="M204 502h72" stroke={seam} strokeWidth="5" strokeLinecap="round" opacity=".65" />
      </g>
    );
  }

  if (type.includes("bottle")) {
    return (
      <g>
        <rect x="193" y="103" width="94" height="72" rx="18" fill={outline} />
        <path d="M181 161h118l22 68v249c0 39-28 62-81 62s-81-23-81-62V229Z" fill={fill} stroke={outline} strokeWidth="7" />
        <path d="M166 238h148" stroke={seam} strokeWidth="7" opacity=".7" />
        <path d="M171 469c35 12 103 12 138 0" fill="none" stroke={outline} strokeWidth="4" opacity=".25" />
        {art(240, 350, 0.72)}
      </g>
    );
  }

  if (type.includes("jogger")) {
    return (
      <g>
        <path d="M144 142h192l-17 386c-2 32-76 34-79 0l-8-235-13 235c-2 33-76 32-79 0Z" fill={fill} stroke={outline} strokeWidth="7" strokeLinejoin="round" />
        <path d="M141 151c54 14 144 14 198 0v54c-55 13-143 13-198 0Z" fill={seam} stroke={outline} strokeWidth="5" />
        <path d="M240 201v91M164 234l48 31M316 234l-48 31" fill="none" stroke={outline} strokeWidth="4" opacity=".38" />
        <path d="M142 495h76M242 495h76" stroke={seam} strokeWidth="13" />
        {art(180, 326, 0.48)}
      </g>
    );
  }

  if (type.includes("short") || type.includes("boxer")) {
    return (
      <g>
        <path d="M124 206h232l-15 236-98-7-4-118-4 118-98 7Z" fill={fill} stroke={outline} strokeWidth="7" strokeLinejoin="round" />
        <path d="M125 207h230v56H125Z" fill={seam} stroke={outline} strokeWidth="5" />
        <path d="M239 260v58M151 290l55 24M329 290l-55 24" fill="none" stroke={outline} strokeWidth="4" opacity=".38" />
        {art(185, 352, 0.48)}
      </g>
    );
  }

  if (type.includes("dress")) {
    return (
      <g>
        <path d="M181 137c32 21 86 21 118 0l82 74-56 72-27-22 55 270H127l55-270-27 22-56-72Z" fill={fill} stroke={outline} strokeWidth="7" strokeLinejoin="round" />
        <path d="M181 137c6 75 112 75 118 0" fill={seam} stroke={outline} strokeWidth="5" />
        <path d="M168 464c45 12 99 12 144 0" fill="none" stroke={outline} strokeWidth="4" opacity=".28" />
        {art(240, 330, 0.76)}
      </g>
    );
  }

  if (type.includes("co-ord")) {
    return (
      <g>
        <path d="M111 157l64-42c35 24 95 24 130 0l64 42-40 85-30-17 8 116H173l8-116-30 17Z" fill={fill} stroke={outline} strokeWidth="6" strokeLinejoin="round" />
        <path d="M181 115c8 52 110 52 118 0" fill={seam} stroke={outline} strokeWidth="4" />
        <path d="M157 370h166l19 164h-79l-23-100-23 100h-79Z" fill={fill} stroke={outline} strokeWidth="6" strokeLinejoin="round" />
        <path d="M158 372h164" stroke={seam} strokeWidth="13" />
        {art(240, 247, 0.54)}
      </g>
    );
  }

  if (type.includes("hoodie")) {
    return (
      <g>
        <path d="M170 172c5-75 135-75 140 0l-19 41H189Z" fill={fill} stroke={outline} strokeWidth="7" />
        <path d="M174 167l-91 71 45 96 46-29-12 229h156l-12-229 46 29 45-96-91-71c-28 23-104 23-132 0Z" fill={fill} stroke={outline} strokeWidth="7" strokeLinejoin="round" />
        <path d="M184 169c10 63 102 63 112 0M202 199l-8 68M278 199l8 68" fill="none" stroke={seam} strokeWidth="6" strokeLinecap="round" />
        <path d="M178 430c35-24 89-24 124 0l-15 56h-94Z" fill="#000" opacity=".13" stroke={outline} strokeWidth="4" />
        {art(240, 342, 0.67)}
      </g>
    );
  }

  if (type.includes("shirt")) {
    return (
      <g>
        <path d="M172 141l68 25 68-25 85 73-54 90-39-25 13 255H167l13-255-39 25-54-90Z" fill={fill} stroke={outline} strokeWidth="7" strokeLinejoin="round" />
        <path d="M172 141l68 25-41 71-34-72ZM308 141l-68 25 41 71 34-72Z" fill={seam} stroke={outline} strokeWidth="5" strokeLinejoin="round" />
        <path d="M240 171v363" stroke={outline} strokeWidth="4" opacity=".55" />
        {[266, 310, 354, 398, 442].map((y) => <circle key={y} cx="251" cy={y} r="4" fill={seam} />)}
        {art(240, 355, 0.63)}
      </g>
    );
  }

  return (
    <g>
      <path d="M172 142l68 25 68-25 86 73-54 90-39-24 13 253H166l13-253-39 24-54-90Z" fill={fill} stroke={outline} strokeWidth="7" strokeLinejoin="round" />
      <path d="M177 144c12 73 114 73 126 0" fill={seam} stroke={outline} strokeWidth="5" />
      <path d="M170 489c39 10 101 10 140 0" fill="none" stroke={outline} strokeWidth="4" opacity=".25" />
      {art(240, 332, type.includes("oversized") ? 0.82 : 0.7)}
    </g>
  );
}

export function ProductVisual({
  product,
  variant = "front",
  view,
  color,
  className,
  title,
  decorative = false,
  priority = false,
}: ProductVisualProps) {
  const requestedVariant = view ?? variant;
  const normalizedVariant = requestedVariant === "flat-lay" ? "flat" : requestedVariant;
  const chosenColor =
    typeof color === "string" ? { name: color, hex: color } : color ?? product.colors[0];
  const safeColor = chosenColor.hex.replace(/[^a-zA-Z0-9]/g, "");
  const id = `mi-product-${product.id}-${normalizedVariant}-${safeColor}`;
  const label =
    title ?? `${product.name} in ${chosenColor.name}, ${normalizedVariant === "flat" ? "flat lay" : normalizedVariant} view`;
  const garmentTransform =
    normalizedVariant === "detail"
      ? "translate(-50 -88) scale(1.22)"
      : normalizedVariant === "flat"
        ? "rotate(-5 240 330)"
        : undefined;

  const currentImage =
    normalizedVariant === "back"
      ? product.backImageUrl || product.imageUrl
      : product.imageUrl;

  if (currentImage) {
    const isDetail = normalizedVariant === "detail";
    return (
      <svg
        className={className}
        viewBox="0 0 480 640"
        role={decorative ? undefined : "img"}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : label}
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        data-variant={normalizedVariant}
        data-priority={priority || undefined}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${id}-photo-scrim`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
            <stop offset="25%" stopColor="#000" stopOpacity="0" />
            <stop offset="65%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id={`${id}-badge-bg`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#111" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#222" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        <image
          href={currentImage}
          x={isDetail ? "-72" : "0"}
          y={isDetail ? "-96" : "0"}
          width={isDetail ? "624" : "480"}
          height={isDetail ? "832" : "640"}
          preserveAspectRatio="xMidYMid slice"
        />

        <rect width="480" height="640" fill={`url(#${id}-photo-scrim)`} />

        <g aria-hidden="true">
          <rect x="20" y="20" width="88" height="26" rx="13" fill={`url(#${id}-badge-bg)`} />
          <text x="64" y="37" fill="#fff" fontSize="9" textAnchor="middle" fontWeight="800" letterSpacing="1.7">
            MI / {String(product.id).slice(-2)}
          </text>
          <text x="460" y="594" fill="#fff" fillOpacity=".96" fontSize="10" textAnchor="end" fontWeight="900" letterSpacing="2.2">
            {product.collection.toUpperCase()}
          </text>
          <text x="460" y="612" fill="#fff" fillOpacity=".78" fontSize="8" textAnchor="end" fontWeight="700" letterSpacing="1.5">
            {normalizedVariant === "back"
              ? "ALTERNATE VIEW"
              : normalizedVariant === "detail"
                ? "FABRIC CLOSE-UP"
                : product.type.toUpperCase()}
          </text>
        </g>
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 480 640"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
      data-variant={normalizedVariant}
      data-priority={priority || undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-background`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={product.palette[2]} />
          <stop offset=".52" stopColor={product.palette[1]} stopOpacity=".55" />
          <stop offset="1" stopColor={product.palette[0]} stopOpacity=".78" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="40%" r="56%">
          <stop stopColor="#fff" stopOpacity=".78" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-shadow`} x="-30%" y="-25%" width="160%" height="170%">
          <feDropShadow dx="0" dy="18" stdDeviation="13" floodColor="#000" floodOpacity=".24" />
        </filter>
        <pattern id={`${id}-grain`} width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="4" r="1" fill="#fff" opacity=".2" />
          <circle cx="18" cy="13" r=".8" fill="#111" opacity=".12" />
        </pattern>
      </defs>

      <rect width="480" height="640" fill={`url(#${id}-background)`} />
      <rect width="480" height="640" fill={`url(#${id}-grain)`} />
      <circle cx="242" cy="282" r="220" fill={`url(#${id}-glow)`} />
      <path d="M-40 109C92 31 276 18 515 89" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="2" />
      <path d="M-31 544C137 604 310 598 515 512" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="2" />
      <circle cx="55" cy="94" r="26" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="2" />
      <circle cx="419" cy="520" r="47" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="2" />

      <g filter={`url(#${id}-shadow)`} transform={garmentTransform}>
        <ProductShape product={product} fill={chosenColor.hex} variant={normalizedVariant} />
      </g>

      <g aria-hidden="true">
        <rect x="25" y="25" width="91" height="29" rx="14.5" fill="#111" fillOpacity=".82" />
        <text x="70.5" y="44" fill="#fff" fontSize="9" textAnchor="middle" fontWeight="800" letterSpacing="1.7">MI / {String(product.id).slice(-2)}</text>
        <text x="455" y="591" fill="#fff" fillOpacity=".88" fontSize="9" textAnchor="end" fontWeight="800" letterSpacing="2.2">{product.collection.toUpperCase()}</text>
        <text x="455" y="610" fill="#fff" fillOpacity=".68" fontSize="8" textAnchor="end" fontWeight="700" letterSpacing="1.5">ORIGINAL ARTWORK</text>
      </g>
    </svg>
  );
}
