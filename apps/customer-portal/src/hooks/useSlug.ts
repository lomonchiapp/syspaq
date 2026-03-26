/**
 * Extracts the tenant slug from the subdomain.
 *
 * Expected format: {slug}.portal.syspaq.com
 * In development:  {slug}.localhost (or fallback to "demo")
 *
 * Override with VITE_PORTAL_SLUG env var for local dev.
 */
export function useSlug(): string {
  // Allow override for local development
  const envSlug = import.meta.env.VITE_PORTAL_SLUG;
  if (envSlug) return envSlug;

  const hostname = window.location.hostname;

  // Production: cargord.portal.syspaq.com → "cargord"
  // The subdomain is everything before ".portal.syspaq.com"
  const portalSuffix = ".portal.syspaq.com";
  if (hostname.endsWith(portalSuffix)) {
    return hostname.slice(0, -portalSuffix.length);
  }

  // Dev: cargord.localhost → "cargord"
  if (hostname.endsWith(".localhost")) {
    return hostname.split(".")[0];
  }

  // Custom domain: look up via API (future) — for now fallback
  // If it's just "localhost" or "portal.syspaq.com" with no subdomain, use "demo"
  if (hostname === "localhost" || hostname === "portal.syspaq.com") {
    return "demo";
  }

  // For any other custom domain, the first part of the hostname
  return hostname.split(".")[0];
}
