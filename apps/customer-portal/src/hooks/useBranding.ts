import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface BranchOption {
  id: string;
  name: string;
  code: string;
  type: string;
}

export interface Branding {
  companyName: string;
  logo: string | null;
  primaryColor: string;
  bgImage: string | null;
  welcomeText: string;
  branches: BranchOption[];
}

const cache = new Map<string, Branding>();

export function useBranding(slug: string) {
  const [branding, setBranding] = useState<Branding | null>(cache.get(slug) ?? null);
  const [loading, setLoading] = useState(!cache.has(slug));

  useEffect(() => {
    if (!slug || cache.has(slug)) return;
    api.get<Branding>(`/portal/${slug}/config`)
      .then((b) => {
        // Ensure branches array exists for backward compat
        if (!b.branches) b.branches = [];
        cache.set(slug, b);
        setBranding(b);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  return { branding, loading };
}
