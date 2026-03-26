const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("portal-token");
  const res = await fetch(`${BASE}/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error" }));
    throw new Error(err.detail || err.message || "Error");
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
