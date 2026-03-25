import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@syspaq/ui";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "accent";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-[var(--primary)] text-white hover:brightness-110 focus-visible:ring-[var(--primary)]/40",
  secondary:
    "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:ring-[var(--secondary)]",
  outline:
    "border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:ring-[var(--border)]",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:ring-[var(--muted)]",
  destructive:
    "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/40",
  accent:
    "bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-110 focus-visible:ring-[var(--accent)]/40",
};

const sizeClasses: Record<string, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-6 text-sm gap-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
