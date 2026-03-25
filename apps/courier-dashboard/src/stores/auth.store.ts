import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface SignupData {
  companyName: string;
  slug: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface SignupResult {
  tenant: { id: string; slug: string; name: string };
  api_key: string;
}

interface AuthState {
  token: string | null;
  tenantId: string | null;
  role: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, tenant: string) => Promise<void>;
  signup: (data: SignupData) => Promise<SignupResult>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      tenantId: null,
      role: null,
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string, tenant: string) => {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/v1/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Tenant-Id": tenant,
            },
            body: JSON.stringify({ email, password }),
          }
        );

        if (!res.ok) {
          const error = await res.json().catch(() => ({ detail: "Error de autenticación" }));
          throw new Error(error.detail || "Credenciales inválidas");
        }

        const data = await res.json();
        const { access_token, user } = data;

        // Decode JWT to get tenantId (resolved UUID)
        const payload = JSON.parse(atob(access_token.split(".")[1]));

        localStorage.setItem("auth-token", access_token);
        localStorage.setItem("auth-tenant-id", payload.tenantId);

        set({
          token: access_token,
          tenantId: payload.tenantId,
          role: payload.role,
          user,
          isAuthenticated: true,
        });
      },

      signup: async (data: SignupData): Promise<SignupResult> => {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/v1/auth/signup`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Error al crear cuenta" }));
          throw new Error(err.detail || err.message || "Error al crear cuenta");
        }

        const result = await res.json();
        const { access_token, tenant, api_key } = result;
        const payload = JSON.parse(atob(access_token.split(".")[1]));

        localStorage.setItem("auth-token", access_token);
        localStorage.setItem("auth-tenant-id", payload.tenantId);

        set({
          token: access_token,
          tenantId: payload.tenantId,
          role: payload.role,
          user: null,
          isAuthenticated: true,
        });

        return { tenant, api_key };
      },

      logout: () => {
        localStorage.removeItem("auth-token");
        localStorage.removeItem("auth-tenant-id");
        set({ token: null, tenantId: null, role: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: "courier-auth",
      partialize: (state) => ({
        token: state.token,
        tenantId: state.tenantId,
        role: state.role,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
