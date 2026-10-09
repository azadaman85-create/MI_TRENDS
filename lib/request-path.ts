/**
 * The current route, passed from the firewall to the server components that need it.
 *
 * `generateMetadata` runs without any knowledge of which route it is rendering, so a
 * canonical URL built there would have to be hardcoded — which is how every page ended
 * up declaring the homepage as its canonical. proxy.ts sets this header on the forwarded
 * request and metadata reads it back.
 */
export const PATHNAME_HEADER = "x-pathname";
