/**
 * Subdomain and Domain Routing Helpers for GadgetZone
 * Supports https://gzones.in (Main Store) and https://admin.gzones.in (Admin Portal)
 */

export interface SsoUserPayload {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface SsoPayload {
  token: string;
  user: SsoUserPayload;
  exp?: number;
}

/**
 * Checks whether the current window location represents the dedicated admin portal.
 * Matches:
 *  - "admin.gzones.in"
 *  - Any subdomain starting with "admin." (e.g. admin.localhost during local development)
 *  - Developer simulation query param: "?subdomain=admin" or "?view=admin_subdomain"
 */
export const isAdminSubdomain = (): boolean => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname.toLowerCase();

  if (hostname === "admin.gzones.in" || hostname.startsWith("admin.")) {
    return true;
  }

  const searchParams = new URLSearchParams(window.location.search);
  if (
    searchParams.get("subdomain") === "admin" ||
    searchParams.get("view") === "admin_subdomain"
  ) {
    return true;
  }

  return false;
};

/**
 * Returns the public storefront URL for customers.
 * On production: https://gzones.in/
 * On local dev: http://localhost:5173/ (or active dev port)
 */
export const getStorefrontUrl = (): string => {
  return "/";
};

export const getAdminPortalUrl = (_token?: string | null, _user?: any): string => {
  return "/admin";
};

/**
 * Extracts and decodes single-sign-on credentials from hash (#sso=... or #auth=...)
 * and immediately cleans the address bar.
 */
export const extractSsoData = (): { token: string; user: SsoUserPayload } | null => {
  if (typeof window === "undefined") return null;

  try {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.substring(1)
      : window.location.hash;

    if (!hash) return null;

    const params = new URLSearchParams(hash);
    const rawSso = params.get("sso") || params.get("auth");
    if (!rawSso) return null;

    const decodedStr = decodeURIComponent(escape(atob(rawSso)));
    const payload = JSON.parse(decodedStr) as SsoPayload;

    if (payload?.token && payload?.user?.isAdmin) {
      // Check expiration if present
      if (payload.exp && Date.now() > payload.exp) {
        console.warn("SSO transfer token expired.");
        return null;
      }
      return { token: payload.token, user: payload.user };
    }
  } catch (err) {
    console.warn("Failed to decode SSO credentials:", err);
  } finally {
    // Strip hash fragment immediately so token isn't retained in URL or browser history
    if (window.location.hash.includes("sso=") || window.location.hash.includes("auth=")) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }

  return null;
};
