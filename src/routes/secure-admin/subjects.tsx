import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { Button, Card, Stat } from "@/components/ui-bits";
import { adminListSubjects, adminUpsertSubject } from "@/lib/api/admin.cms.functions";

export const Route = createFileRoute("/secure-admin/subjects")({
  head: () => ({ meta: [{ title: "Manage Subjects — NeetForge" }] }),
  component: AdminSubjects,
});

function AdminSubjects() {
  const queryClient = useQueryClient();
  const [activeSubject, setActiveSubject] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => await adminListSubjects(),
  });

  const saveMutation = useMutation({
    mutationFn: async (item: any) => await adminUpsertSubject({ data: item }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
      setActiveSubject(null);
      setName("");
      setDescription("");
    },
  });

  const beginEdit = (subject: any) => {
    setActiveSubject(subject);
    setName(subject.name);
    setDescription(subject.description ?? "");
  };

  const handleSubmit = async () => {
    await saveMutation.mutateAsync({ id: activeSubject?.id, name, description });
  };

  const subjectCount = useMemo(() => (data ?? []).length, [data]);

  return (
    <AdminShell
      title="Subject management"
      description="Create and manage NEET subjects that drive chapter, question, and syllabus relationships."
      active="/secure-admin/subjects"
    >
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold">Subjects</h2>
              <p className="text-sm text-muted-foreground">Create a reusable subject taxonomy for the curriculum.</p>
            </div>
            <div className="text-sm text-muted-foreground">{subjectCount} subjects</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-surface text-sm uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((subject: any) => (
                  <tr key={subject.id} className="border-t border-border">
                    <td className="px-3 py-3 text-sm">{subject.name}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">{subject.description || "—"}</td>
                    <td className="px-3 py-3 text-sm">
                      <button
                        onClick={() => beginEdit(subject)}
                        className="rounded-md border border-border bg-surface px-3 py-1 text-sm text-foreground hover:bg-surface-2"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {((data ?? []).length === 0 && !isLoading) ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No subjects yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{activeSubject ? "Edit subject" : "Add subject"}</h2>
              <p className="text-sm text-muted-foreground">Subjects allow you to organize chapters, questions, tests, and lectures consistently.</p>
            </div>
            <label className="block text-sm text-foreground">
              <span className="text-xs text-muted-foreground">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </label>
            <label className="block text-sm text-foreground">
              <span className="text-xs text-muted-foreground">Description</span>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </label>
            <div className="flex gap-2 flex-wrap">
              <Button variant="primary" onClick={handleSubmit} disabled={saveMutation.isLoading}>
                {activeSubject ? "Save subject" : "Create subject"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveSubject(null);
                  setName("");
                  setDescription("");
                }}
              >
                Reset
              </Button>
            </div>
            {saveMutation.error && <p className="text-sm text-destructive">Unable to save subject.</p>}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
