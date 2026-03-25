import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  token: string | null;
  tenantId: string | null;
  role: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, tenant: string) => Promise<void>;
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
