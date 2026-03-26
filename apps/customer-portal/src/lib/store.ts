// Minimal auth store — no Zustand dependency, just localStorage + events

export interface CustomerInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  casillero: string;
}

export function getToken(): string | null {
  return localStorage.getItem("portal-token");
}

export function getCustomer(): CustomerInfo | null {
  const raw = localStorage.getItem("portal-customer");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setSession(token: string, customer: CustomerInfo) {
  localStorage.setItem("portal-token", token);
  localStorage.setItem("portal-customer", JSON.stringify(customer));
}

export function clearSession() {
  localStorage.removeItem("portal-token");
  localStorage.removeItem("portal-customer");
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch { return false; }
}
