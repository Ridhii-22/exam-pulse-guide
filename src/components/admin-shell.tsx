import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  ClipboardList,
  FileText,
  PlayCircle,
  BarChart3,
  Moon,
  Sun,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { type ReactNode } from "react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { AdminGuard } from "@/components/admin-guard";
import { useAuth } from "@/lib/auth";

const nav = [
  { to: "/secure-admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/secure-admin/questions", label: "Questions", icon: Database },
  { to: "/secure-admin/tests", label: "Tests", icon: ClipboardList },
  { to: "/secure-admin/papers", label: "Papers", icon: FileText },
  { to: "/secure-admin/lectures", label: "Lectures", icon: PlayCircle },
  { to: "/secure-admin/subjects", label: "Subjects", icon: Sparkles },
  { to: "/secure-admin/syllabus", label: "Syllabus", icon: BarChart3 },
  { to: "/secure-admin/bulk-import", label: "Bulk import", icon: ArrowRight },
  { to: "/secure-admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminShell({
  children,
  title,
  description,
  active,
  action,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  active: string;
  action?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const { signOut } = useAuth();

  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-background text-foreground">
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 sticky top-0 h-screen">
          <Link to="/secure-admin" className="flex items-center gap-3 px-2 mb-8">
            <div className="size-10 rounded-2xl bg-primary/15 text-primary grid place-items-center">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">NeetForge Admin</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">
                Hidden content management
              </div>
            </div>
          </Link>

          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const activeItem = pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeItem
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-2",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="card-soft p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="size-4 text-primary" /> Hidden admin workspace
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Only authorized accounts may view or manage protected content.
              </p>
            </div>
            <button
              onClick={toggle}
              className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-border bg-background/90 backdrop-blur">
            <Link to="/secure-admin" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/15 text-primary grid place-items-center">
                <Sparkles className="size-4" />
              </div>
              <span className="font-semibold tracking-tight">NeetForge Admin</span>
            </Link>
            <button
              onClick={toggle}
              className="size-9 grid place-items-center rounded-lg hover:bg-surface-2 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </header>

          <main className="flex-1 pb-20 lg:pb-10">
            <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl w-full mx-auto">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
                  {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                </div>
                <div>{action}</div>
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
