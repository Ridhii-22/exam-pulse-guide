import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [bypassAuth, setBypassAuth] = useState(false);

  // DEV MODE: Allow admin access for visual QA (client-side only check)
  useEffect(() => {
    const isDevMode = import.meta.env.DEV;
    if (isDevMode && typeof window !== "undefined") {
      const bypass = localStorage.getItem("__dev_bypass_admin_auth") === "true";
      setBypassAuth(bypass);
    }
  }, []);

  useEffect(() => {
    if (!loading && !bypassAuth) {
      if (!user) {
        navigate({ to: "/login", replace: true });
      } else if (role !== "admin") {
        navigate({ to: "/", replace: true });
      }
    }
  }, [loading, user, role, navigate, bypassAuth]);

  if ((loading || !user || role !== "admin") && !bypassAuth) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4 text-sm text-muted-foreground">
        Checking admin access…
      </div>
    );
  }

  return <>{children}</>;
}
