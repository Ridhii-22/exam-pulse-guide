import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { Button, Card } from "@/components/ui-bits";
import { adminDeletePaper, adminListPapers, adminUpsertPaper, adminUploadPaperPDF } from "@/lib/api/admin.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/secure-admin/papers")({
  head: () => ({ meta: [{ title: "Manage Papers — NeetForge" }] }),
  component: AdminPapers,
});

const defaultPaper = {
  title: "",
  paper_type: "Full NEET PYQ",
  subject: "",
  chapter: "",
  year: "",
  description: "",
  pdf_url: "",
  attempt_as_test: false,
};

const paperTypes = ["Full NEET PYQ", "Subject Wise", "Chapter Wise", "Mock Test"];
const neetSubjects = ["Physics", "Chemistry", "Biology", "Full Paper"];

function AdminPapers() {
  const [search, setSearch] = useState("");
  const [activePaper, setActivePaper] = useState<any>(null);
  const [formData, setFormData] = useState(defaultPaper);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-papers", search],
    queryFn: async () => await adminListPapers({ data: { search, sessionToken: session?.access_token } }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }
      // Convert File to base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
      return await adminUploadPaperPDF({ data: { filename: file.name, fileBase64, sessionToken: session.access_token } });
    },
    onSuccess: (data) => {
      setFormData((prev) => ({ ...prev, pdf_url: data.url }));
      setIsUploading(false);
    },
    onError: (error) => {
      setIsUploading(false);
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.message}`);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: any) => await adminUpsertPaper({ data: { item } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-papers"] });
      queryClient.invalidateQueries({ queryKey: ["public-papers"] });
      setActivePaper(null);
      setFormData(defaultPaper);
      alert("Paper saved successfully!");
    },
    onError: (error) => {
      console.error("Save error:", error);
      alert(`Save failed: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await adminDeletePaper({ data: { id, sessionToken: session?.access_token } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-papers"] });
      queryClient.invalidateQueries({ queryKey: ["public-papers"] });
    },
  });

  const beginEdit = (item: any) => {
    setActivePaper(item);
    setFormData({
      title: item.title,
      paper_type: item.paper_type ?? "Full NEET PYQ",
      subject: item.subject ?? "",
      chapter: item.chapter ?? "",
      year: item.year ?? "",
      description: item.description ?? "",
      pdf_url: item.pdf_url,
      attempt_as_test: item.attempt_as_test,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      uploadMutation.mutate(file);
    } else {
      alert("Please select a valid PDF file");
    }
  };

  return (
    <AdminShell
      title="Paper management"
      description="Organize question papers by year, category and enable attempts as test modules."
      active="/secure-admin/papers"
    >
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Paper library</h2>
              <p className="text-sm text-muted-foreground">Add new PDFs and keep student paper access curated.</p>
            </div>
          </div>

          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search papers by title or year"
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
                  <th className="px-3 py-2">Chapter</th>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">As test</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((item: any) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-3 text-sm">{item.title}</td>
                    <td className="px-3 py-3 text-sm">{item.paper_type || "—"}</td>
                    <td className="px-3 py-3 text-sm">{item.subject || "—"}</td>
                    <td className="px-3 py-3 text-sm">{item.chapter || "—"}</td>
                    <td className="px-3 py-3 text-sm">{item.year || "—"}</td>
                    <td className="px-3 py-3 text-sm">{item.attempt_as_test ? "Yes" : "No"}</td>
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
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No papers found.
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
              <h2 className="text-lg font-semibold">{activePaper ? "Edit paper" : "Add paper"}</h2>
              <p className="text-sm text-muted-foreground">Upload NEET papers with proper categorization for student access.</p>
            </div>

            <Field label="Title" value={formData.title} onChange={(value) => setFormData((prev) => ({ ...prev, title: value }))} />

            <label className="block text-sm text-foreground">
              <span className="text-xs text-muted-foreground">Paper Type</span>
              <select
                value={formData.paper_type}
                onChange={(e) => setFormData((prev) => ({ ...prev, paper_type: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {paperTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-foreground">
              <span className="text-xs text-muted-foreground">Subject</span>
              <select
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select subject</option>
                {neetSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </label>

            {formData.paper_type === "Chapter Wise" && (
              <Field label="Chapter" value={formData.chapter} onChange={(value) => setFormData((prev) => ({ ...prev, chapter: value }))} placeholder="e.g., Human Physiology" />
            )}

            <Field label="Year" value={formData.year} onChange={(value) => setFormData((prev) => ({ ...prev, year: value }))} placeholder="e.g., 2024" />

            <div>
              <label className="block text-xs text-muted-foreground mb-2">PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              />
              {isUploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
              {uploadMutation.error && <p className="text-xs text-destructive mt-1">Upload failed</p>}
            </div>

            <label className="block text-sm text-foreground">
              <span className="text-xs text-muted-foreground">Description (optional)</span>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={3}
              />
            </label>

            {!activePaper && (
              <Field label="PDF URL" value={formData.pdf_url} onChange={(value) => setFormData((prev) => ({ ...prev, pdf_url: value }))} placeholder="Leave empty if uploading file" />
            )}
            
            <div className="flex items-center gap-3 text-sm">
              <input
                id="attempt-as-test"
                type="checkbox"
                checked={formData.attempt_as_test}
                onChange={(e) => setFormData((prev) => ({ ...prev, attempt_as_test: e.target.checked }))}
                className="h-4 w-4 rounded border-input text-primary focus-visible:ring-ring"
              />
              <label htmlFor="attempt-as-test" className="text-sm text-foreground">
                Enable attempt as test
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => saveMutation.mutate({ ...activePaper, ...formData })} disabled={saveMutation.status === "pending" || !formData.title || !formData.pdf_url}>
                {activePaper ? "Save paper" : "Add paper"}
              </Button>
              <Button variant="secondary" onClick={() => { setActivePaper(null); setFormData(defaultPaper); }}>
                Reset
              </Button>
            </div>
            {saveMutation.error && <p className="text-sm text-destructive">Unable to save paper.</p>}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block text-sm text-foreground">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </label>
  );
}
