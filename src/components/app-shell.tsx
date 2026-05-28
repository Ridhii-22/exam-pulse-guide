import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, ClipboardList, FileText, PlayCircle, User, Moon, Sun, Sparkles, Flame } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { ChatbotFab } from "@/components/chatbot-fab";

const nav = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/tests", label: "Tests", icon: ClipboardList },
  { to: "/papers", label: "Papers", icon: FileText },
  { to: "/lectures", label: "Lectures", icon: PlayCircle },
  { to: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children?: ReactNode }) {
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2 px-2 mb-8">
          <div className="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">NeetForge</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">Premium NEET prep</div>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {nav.map((n) => {
            const active = isActive(n.to, n.exact);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
                )}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="card-soft p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Flame className="size-4 text-warning" /> 12-day streak
            </div>
            <p className="text-xs text-muted-foreground mt-1">Don't break the chain — solve 10 Qs to extend.</p>
          </div>
          <button
            onClick={toggle}
            className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-border bg-background/80 backdrop-blur">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/15 text-primary grid place-items-center">
              <Sparkles className="size-4" />
            </div>
            <span className="font-semibold tracking-tight">NeetForge</span>
          </Link>
          <button
            onClick={toggle}
            className="size-9 grid place-items-center rounded-lg hover:bg-surface-2 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </header>

        <main className="flex-1 pb-24 lg:pb-10">{children ?? <Outlet />}</main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur">
          <div className="grid grid-cols-5">
            {nav.map((n) => {
              const active = isActive(n.to, n.exact);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <n.icon className="size-5" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <ChatbotFab />
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-4 md:px-8 py-6 md:py-10 max-w-7xl w-full mx-auto", className)}>{children}</div>;
}

// re-export for convenience
export { useState };
