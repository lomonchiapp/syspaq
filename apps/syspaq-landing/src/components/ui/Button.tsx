import { motion } from "motion/react";
import { cn } from "@syspaq/ui";

type Variant = "primary" | "secondary" | "accent";

interface ButtonProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  href?: string;
  onClick?: () => void;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20",
  secondary:
    "border border-surface-500 text-surface-100 hover:bg-surface-800 hover:border-surface-400",
  accent:
    "bg-accent-500 text-surface-950 hover:bg-accent-400 shadow-lg shadow-accent-500/20 font-semibold",
};

export function Button({
  children,
  variant = "primary",
  className,
  href,
  onClick,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors cursor-pointer",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <motion.a
        href={href}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={classes}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={classes}
    >
      {children}
    </motion.button>
  );
}
