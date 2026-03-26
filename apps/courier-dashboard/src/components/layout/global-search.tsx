import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, Users, Package, Inbox, Loader2 } from "lucide-react";
import { cn } from "@syspaq/ui";
import { api } from "@/lib/api-client";

type SearchCategory = "customers" | "shipments" | "receptions";

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  path: string;
}

const CATEGORIES: {
  key: SearchCategory;
  label: string;
  icon: typeof Users;
  placeholder: string;
}[] = [
  { key: "customers", label: "Cliente", icon: Users, placeholder: "Nombre, email o casillero..." },
  { key: "shipments", label: "Envio", icon: Package, placeholder: "Tracking o referencia..." },
  { key: "receptions", label: "Recepcion", icon: Inbox, placeholder: "ID de envio o sucursal..." },
];

export function GlobalSearch() {
  const [category, setCategory] = useState<SearchCategory>("customers");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  const currentCat = CATEGORIES.find((c) => c.key === category)!;

  const doSearch = useCallback(
    async (q: string, cat: SearchCategory) => {
      if (!q.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const params = new URLSearchParams({ search: q, limit: "8", page: "1" });

        if (cat === "customers") {
          const res = await api.get<{
            data: { id: string; firstName: string; lastName: string; email: string; casillero?: string }[];
          }>(`/v1/customers?${params}`);
          setResults(
            res.data.map((c) => ({
              id: c.id,
              label: `${c.firstName} ${c.lastName}`,
              sublabel: c.casillero ? `${c.casillero} - ${c.email}` : c.email,
              path: `/customers/${c.id}`,
            })),
          );
        } else if (cat === "shipments") {
          const res = await api.get<{
            data: { id: string; trackingNumber: string; reference?: string; phase: string }[];
          }>(`/v1/shipments?${params}`);
          setResults(
            res.data.map((s) => ({
              id: s.id,
              label: s.trackingNumber,
              sublabel: s.reference || s.phase,
              path: `/shipments/${s.id}`,
            })),
          );
        } else {
          const res = await api.get<{
            data: { id: string; shipmentId: string; status: string; receivedAt: string }[];
          }>(`/v1/receptions?${params}`);
          setResults(
            res.data.map((r) => ({
              id: r.id,
              label: `Recepcion ${r.id.slice(0, 8)}...`,
              sublabel: `Envio: ${r.shipmentId.slice(0, 8)}... - ${r.status}`,
              path: `/receptions`,
            })),
          );
        }

        setShowResults(true);
        setSelectedIdx(-1);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [],
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value, category), 300);
  };

  const handleCategoryChange = (cat: SearchCategory) => {
    setCategory(cat);
    setResults([]);
    setShowResults(false);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setShowResults(false);
    setQuery("");
  };

  /* Keyboard nav */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIdx >= 0 && results[selectedIdx]) {
      e.preventDefault();
      handleSelect(results[selectedIdx]);
    } else if (e.key === "Escape") {
      setShowResults(false);
    }
  };

  /* Click outside */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Global shortcut: / to focus search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const CatIcon = currentCat.icon;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] transition-colors focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/25">
        {/* Category selector */}
        <div className="relative flex-shrink-0">
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as SearchCategory)}
            className="h-8 appearance-none rounded-l-lg border-r border-[var(--border)] bg-transparent pl-8 pr-8 text-xs font-semibold text-[var(--foreground)] focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <CatIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            placeholder={currentCat.placeholder}
            className="h-8 w-full bg-transparent px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--muted-foreground)]" />
            ) : (
              <kbd className="hidden sm:inline-flex h-4 items-center rounded border border-[var(--border)] px-1 font-mono text-[9px] text-[var(--muted-foreground)]">
                /
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
          >
            {results.map((result, idx) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIdx(idx)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  idx === selectedIdx
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "hover:bg-[var(--secondary)]",
                )}
              >
                <Search className="h-3.5 w-3.5 flex-shrink-0 text-[var(--muted-foreground)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{result.label}</p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {result.sublabel}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {showResults && query.trim() && results.length === 0 && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl px-4 py-6 text-center"
          >
            <p className="text-sm text-[var(--muted-foreground)]">
              No se encontraron resultados para "{query}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
