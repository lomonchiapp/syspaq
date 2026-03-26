import { useParams } from "react-router-dom";

/**
 * Extracts the tenant slug from subdomain OR URL path (fallback).
 *
 * Priority:
 *   1. VITE_PORTAL_SLUG env var (local dev override)
 *   2. Subdomain: cargord.portal.syspaq.com → "cargord"
 *   3. Path param: portal.syspaq.com/cargord/login → "cargord"
 *   4. Fallback: "demo"
 */
export function useSlug(): string {
  const params = useParams<{ slug?: string }>();

  // 1. Env override for local dev
  const envSlug = import.meta.env.VITE_PORTAL_SLUG;
  if (envSlug) return envSlug;

  const hostname = window.location.hostname;

  // 2. Production subdomain: cargord.portal.syspaq.com → "cargord"
  const portalSuffix = ".portal.syspaq.com";
  if (hostname.endsWith(portalSuffix)) {
    return hostname.slice(0, -portalSuffix.length);
  }

  // 3. Dev subdomain: cargord.localhost → "cargord"
  if (hostname.endsWith(".localhost")) {
    return hostname.split(".")[0];
  }

  // 4. Path-based fallback: /:slug/login → slug from URL params
  if (params.slug) return params.slug;

  // 5. Fallback
  if (hostname === "localhost" || hostname === "portal.syspaq.com") {
    return "demo";
  }

  return hostname.split(".")[0];
}

/**
 * Returns true if the current request uses subdomain routing.
 * When true, paths are clean (/login). When false, paths include slug (/:slug/login).
 */
function isSubdomainMode(): boolean {
  const hostname = window.location.hostname;
  if (import.meta.env.VITE_PORTAL_SLUG) return true;
  if (hostname.endsWith(".portal.syspaq.com")) return true;
  if (hostname.endsWith(".localhost")) return true;
  return false;
}

/**
 * Build a portal path that works in both subdomain and path-based modes.
 * Usage: portalPath(slug, "/dashboard") → "/dashboard" or "/cargord/dashboard"
 */
export function usePortalPath() {
  const slug = useSlug();
  const subdomain = isSubdomainMode();

  return (path: string) => (subdomain ? path : `/${slug}${path}`);
}
