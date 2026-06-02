import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { Button, Card } from "@/components/ui-bits";
import { adminListSyllabusVersions, adminUpsertSyllabusVersion } from "@/lib/api/admin.cms.functions";

export const Route = createFileRoute("/secure-admin/syllabus")({
  head: () => ({ meta: [{ title: "Manage Syllabus — NeetForge" }] }),
  component: AdminSyllabus,
});

function AdminSyllabus() {
  const queryClient = useQueryClient();
  const [activeVersion, setActiveVersion] = useState<any>(null);
  const [name, setName] = useState("");
  const [effectiveYear, setEffectiveYear] = useState("");
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-syllabus-versions"],
    queryFn: async () => await adminListSyllabusVersions(),
  });

  const saveMutation = useMutation({
    mutationFn: async (item: any) => await adminUpsertSyllabusVersion({ data: item }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-syllabus-versions"] });
      setActiveVersion(null);
      setName("");
      setEffectiveYear("");
      setNotes("");
    },
  });

  const beginEdit = (version: any) => {
    setActiveVersion(version);
    setName(version.name);
    setEffectiveYear(version.effective_year?.toString() ?? "");
    setNotes(version.notes ?? "");
  };

  const handleSubmit = async () => {
    await saveMutation.mutateAsync({
      id: activeVersion?.id,
      name,
      effective_year: effectiveYear ? Number(effectiveYear) : undefined,
      notes,
    });
  };

  return (
    <AdminShell
      title="Syllabus versions"
      description="Track yearly syllabus updates and map chapters to effective curriculum versions."
      active="/secure-admin/syllabus"
    >
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold">Syllabus versions</h2>
              <p className="text-sm text-muted-foreground">Each version represents a form of the curriculum and can be associated with chapters and year mappings.</p>
            </div>
            <div className="text-sm text-muted-foreground">{(data ?? []).length} versions</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-surface text-sm uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Version</th>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">Notes</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((version: any) => (
                  <tr key={version.id} className="border-t border-border">
                    <td className="px-3 py-3 text-sm">{version.name}</td>
                    <td className="px-3 py-3 text-sm">{version.effective_year ?? "—"}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">{version.notes || "—"}</td>
                    <td className="px-3 py-3 text-sm">
                      <button
                        onClick={() => beginEdit(version)}
                        className="rounded-md border border-border bg-surface px-3 py-1 text-sm text-foreground hover:bg-surface-2"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {((data ?? []).length === 0 && !isLoading) ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No syllabus versions configured.
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
              <h2 className="text-lg font-semibold">{activeVersion ? "Edit version" : "Add version"}</h2>
              <p className="text-sm text-muted-foreground">Create curriculum versions that can be referenced by chapter mappings and analytics.</p>
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
              <span className="text-xs text-muted-foreground">Effective year</span>
              <input
                value={effectiveYear}
                onChange={(e) => setEffectiveYear(e.target.value)}
                type="number"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </label>
            <label className="block text-sm text-foreground">
              <span className="text-xs text-muted-foreground">Notes</span>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </label>
            <div className="flex gap-2 flex-wrap">
              <Button variant="primary" onClick={handleSubmit} disabled={saveMutation.isLoading}>
                {activeVersion ? "Save version" : "Create version"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveVersion(null);
                  setName("");
                  setEffectiveYear("");
                  setNotes("");
                }}
              >
                Reset
              </Button>
            </div>
            {saveMutation.error && <p className="text-sm text-destructive">Unable to save syllabus version.</p>}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
