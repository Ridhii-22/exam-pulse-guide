import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { Button, Card } from "@/components/ui-bits";
import {
  adminDeleteTest,
  adminListTests,
  adminUpsertTest,
} from "@/lib/api/admin.functions";

export const Route = createFileRoute("/secure-admin/tests")({
  head: () => ({ meta: [{ title: "Manage Tests — NeetForge" }] }),
  component: AdminTests,
});

const defaultTest = {
  title: "",
  kind: "chapter",
  subject: "",
  timer_seconds: 0,
  total_marks: 0,
  section_config: {},
  question_ids: [] as string[],
};

function AdminTests() {
  const [search, setSearch] = useState("");
  const [activeTest, setActiveTest] = useState<any>(null);
  const [formData, setFormData] = useState(defaultTest);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tests", search],
    queryFn: async () => await adminListTests({ data: { search } }),
  });

  const saveMutation = useMutation({
    mutationFn: async (item: any) => await adminUpsertTest({ data: { item } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tests"] });
      setActiveTest(null);
      setFormData(defaultTest);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await adminDeleteTest({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tests"] }),
  });

  const beginEdit = (item: any) => {
    setActiveTest(item);
    setFormData({
      title: item.title,
      kind: item.kind,
      subject: item.subject ?? "",
      timer_seconds: item.timer_seconds,
      total_marks: item.total_marks,
      section_config: item.section_config ?? {},
      question_ids: item.question_ids ?? [],
    });
  };

  return (
    <AdminShell
      title="Test management"
      description="Build chapter tests, PYQs, mock papers, and practice sets from the question bank."
      active="/secure-admin/tests"
    >
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Saved tests</h2>
              <p className="text-sm text-muted-foreground">A single source of truth for exam-ready assessments.</p>
            </div>
          </div>

          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tests by title"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-surface text-sm uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Marks</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((item: any) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-3 text-sm">{item.title}</td>
                    <td className="px-3 py-3 text-sm">{item.kind}</td>
                    <td className="px-3 py-3 text-sm">{item.subject || "General"}</td>
                    <td className="px-3 py-3 text-sm">{item.total_marks}</td>
                    <td className="px-3 py-3 flex gap-2 flex-wrap">
                      <Button variant="ghost" size="sm" onClick={() => beginEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(item.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {(data ?? []).length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No tests found.
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
              <h2 className="text-lg font-semibold">{activeTest ? "Edit test" : "Create new test"}</h2>
              <p className="text-sm text-muted-foreground">Configure timing, scoring, and question selection for each assessment.</p>
            </div>
            <Field label="Title" value={formData.title} onChange={(value) => setFormData((prev) => ({ ...prev, title: value }))} />
            <Field label="Test kind" value={formData.kind} onChange={(value) => setFormData((prev) => ({ ...prev, kind: value }))} />
            <Field label="Subject" value={formData.subject} onChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Timer (seconds)" value={String(formData.timer_seconds)} onChange={(value) => setFormData((prev) => ({ ...prev, timer_seconds: Number(value) }))} />
              <Field label="Total marks" value={String(formData.total_marks)} onChange={(value) => setFormData((prev) => ({ ...prev, total_marks: Number(value) }))} />
            </div>
            <Field
              label="Question IDs"
              value={(formData.question_ids || []).join(", ")}
              onChange={(value) => setFormData((prev) => ({ ...prev, question_ids: value.split(",").map((item) => item.trim()).filter(Boolean) }))}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => saveMutation.mutate({ ...activeTest, ...formData })} disabled={saveMutation.status === "pending"}>
                {activeTest ? "Save test" : "Create test"}
              </Button>
              <Button variant="secondary" onClick={() => { setActiveTest(null); setFormData(defaultTest); }}>
                Reset
              </Button>
            </div>
            {saveMutation.error && <p className="text-sm text-destructive">Unable to save test.</p>}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm text-foreground">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </label>
  );
}
