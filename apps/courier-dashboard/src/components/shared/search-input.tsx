import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@syspaq/ui";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: SearchInputProps) {
  const [internal, setInternal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  /* Sync external → internal when parent resets */
  useEffect(() => {
    setInternal(value);
  }, [value]);

  /* Debounce internal → external */
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (internal !== value) {
        onChange(internal);
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [internal]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
      <input
        type="text"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
      />
      {internal && (
        <button
          onClick={() => {
            setInternal("");
            onChange("");
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
