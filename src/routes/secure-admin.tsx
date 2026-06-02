import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/secure-admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NeetForge" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
