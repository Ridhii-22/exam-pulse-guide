import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { Card, Stat, Button } from "@/components/ui-bits";
import { adminGetDashboard } from "@/lib/api/admin.functions";
import { Sparkles, ArrowRight, Database, ClipboardList, FileText, PlayCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/secure-admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NeetForge" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      return await adminGetDashboard();
    },
  });

  return (
    <AdminShell
      title="Admin dashboard"
      description="Manage NEET content, review system health, and keep the student experience focused."
      active="/secure-admin"
      action={
        <Link to="/secure-admin/questions">
          <Button variant="secondary" size="md">
            Open question library
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
        <Stat label="Questions" value={data?.questions ?? 0} icon={<Database className="size-5" />} />
        <Stat label="Tests" value={data?.tests ?? 0} icon={<ClipboardList className="size-5" />} />
        <Stat label="Lectures" value={data?.lectures ?? 0} icon={<PlayCircle className="size-5" />} />
        <Stat label="Papers" value={data?.papers ?? 0} icon={<FileText className="size-5" />} />
        <Stat label="Subjects" value={data?.subjects ?? 0} icon={<Sparkles className="size-5" />} />
        <Stat label="Syllabus versions" value={data?.syllabusVersions ?? 0} icon={<ArrowRight className="size-5" />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold mb-3">Admin quick actions</h2>
          <div className="grid gap-3">
            <Link to="/secure-admin/questions" className="rounded-xl border border-border px-4 py-3 hover:bg-surface-2 transition">
              Manage question bank
            </Link>
            <Link to="/secure-admin/tests" className="rounded-xl border border-border px-4 py-3 hover:bg-surface-2 transition">
              Build tests and mock papers
            </Link>
            <Link to="/secure-admin/lectures" className="rounded-xl border border-border px-4 py-3 hover:bg-surface-2 transition">
              Update lecture playlists
            </Link>
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold mb-3">System notes</h2>
          <p className="text-sm text-muted-foreground leading-6">
            The hidden admin panel is intentionally separate from the student workspace. Content is managed here and surfaced automatically in the student experience without adding admin controls to study flows.
          </p>
          <div className="mt-4 text-xs text-muted-foreground">Loading status: {isLoading ? "Refreshing…" : "Ready"}</div>
        </Card>
      </div>
    </AdminShell>
  );
}
