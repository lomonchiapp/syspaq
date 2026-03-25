import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@syspaq/ui";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)]",
            "placeholder:text-[var(--muted-foreground)]",
            "transition-colors duration-150 resize-y",
            "focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--destructive)] focus:ring-[var(--destructive)]/25",
            className,
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--destructive)]">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
