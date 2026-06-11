import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  as = "div",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  as?: React.ElementType;
  onClick?: () => void;
}) {
  const Tag = as;
  return <Tag className={cn("card-soft p-5", className)} onClick={onClick}>{children}</Tag>;
}

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4">
      {icon && (
        <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
          {icon}
        </div>
      )}
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-semibold tracking-tight mt-0.5">{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      </div>
    </Card>
  );
}

export function ProgressBar({
  value,
  max = 100,
  tone = "primary",
}: {
  value: number;
  max?: number;
  tone?: "primary" | "success" | "warning" | "info";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bg =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : tone === "info"
          ? "bg-info"
          : "bg-primary";
  return (
    <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", bg)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "info" | "danger";
}) {
  const map = {
    default: "bg-surface-2 text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/10 text-info",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-surface-2 text-foreground hover:bg-accent",
    ghost: "text-foreground hover:bg-surface-2",
    outline: "border border-border text-foreground hover:bg-surface-2",
  };
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-11 px-5 text-sm" };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-ring",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Toast({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  onClose: () => void;
}) {
  const bgColors = {
    info: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-destructive",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className={cn("flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white", bgColors[type])}>
        <span className="text-sm">{message}</span>
        <button
          onClick={onClose}
          className="shrink-0 opacity-70 hover:opacity-100 transition"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
