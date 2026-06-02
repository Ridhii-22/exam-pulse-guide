import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard-management")({
  head: () => ({ meta: [{ title: "Admin Redirect — NeetForge" }] }),
  component: DashboardManagementRedirect,
});

function DashboardManagementRedirect() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (role === "admin") {
      navigate({ to: "/secure-admin", replace: true });
    } else {
      navigate({ to: "/", replace: true });
    }
  }, [loading, user, role, navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 text-sm text-muted-foreground">
      Redirecting…
    </div>
  );
}
