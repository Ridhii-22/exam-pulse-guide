import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { Card, Stat, Pill } from "@/components/ui-bits";
import { adminGetDashboard } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/secure-admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — NeetForge" }] }),
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => await adminGetDashboard(),
  });

  return (
    <AdminShell
      title="Platform analytics"
      description="Work with content volume, student reach, and admin operations in one secure panel."
      active="/secure-admin/analytics"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Stat label="Questions" value={data?.questions ?? 0} />
        <Stat label="Tests" value={data?.tests ?? 0} />
        <Stat label="Papers" value={data?.papers ?? 0} />
        <Stat label="Lectures" value={data?.lectures ?? 0} />
        <Stat label="Students" value={data?.students ?? 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-lg font-semibold mb-3">Growth summary</h2>
          <p className="text-sm text-muted-foreground leading-6">
            This analytics view is designed to give admins a secure overview of platform content and student coverage. As the system evolves, metrics such as syllabus completion, active practice sessions, and content performance can be added here.
          </p>
        </Card>

        <Card>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Hidden CMS health</h3>
              <p className="text-xs text-muted-foreground">Content management is separated from the student workspace and only visible through authorized admin routes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="success">Secure</Pill>
              <Pill tone="info">Modular</Pill>
              <Pill tone="warning">Future-ready</Pill>
            </div>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
