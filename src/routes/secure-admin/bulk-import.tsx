import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { Button, Card, Pill } from "@/components/ui-bits";
import { adminBulkUploadPapers, adminBulkUploadQuestions } from "@/lib/api/admin.cms.functions";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/secure-admin/bulk-import")({
  head: () => ({ meta: [{ title: "Bulk import — NeetForge" }] }),
  component: AdminBulkImport,
});

const importOptions = [
  { value: "questions", label: "Questions" },
  { value: "papers", label: "Papers" },
];

function AdminBulkImport() {
  const [importType, setImportType] = useState("questions");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (importType === "questions") {
        return await adminBulkUploadQuestions({ data: payload });
      }
      return await adminBulkUploadPapers({ data: payload });
    },
  });

  const handleFile = async (selected: File | null) => {
    setFile(selected);
    setSummary(null);
    if (!selected) {
      setPreview([]);
      setWarnings([]);
      return;
    }

    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsBinaryString(selected);
    });

    const workbook = XLSX.read(content, { type: "binary" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

    setPreview(rows.slice(0, 10));
    setWarnings([`Parsed ${rows.length} rows from ${selected.name}.`]);
    if (!rows.length) {
      setWarnings(["The uploaded file contains no rows."]);
    }
  };

  const payload = useMemo(() => {
    if (!preview.length) return [];
    return preview.map((row) => {
      if (importType === "questions") {
        return {
          question_text: String(row["question_text"] || row["question"] || "").trim(),
          subject: String(row["subject"] || "").trim(),
          chapter: String(row["chapter"] || "").trim(),
          difficulty: String(row["difficulty"] || "medium").trim(),
          options: String(row["options"] || "").split("|").map((value) => value.trim()).filter(Boolean),
          correct_answer: String(row["correct_answer"] || "").trim(),
          explanation: String(row["explanation"] || "").trim(),
          year: String(row["year"] || "").trim(),
          question_type: String(row["question_type"] || "single_choice").trim(),
        };
      }
      return {
        title: String(row["title"] || "").trim(),
        year: String(row["year"] || "").trim(),
        category: String(row["category"] || "").trim(),
        pdf_url: String(row["pdf_url"] || row["url"] || "").trim(),
        attempt_as_test: String(row["attempt_as_test"] || "false").toLowerCase() === "true",
      };
    });
  }, [importType, preview]);

  const submit = async () => {
    if (!file) return;
    await importMutation.mutateAsync({ items: payload });
    setSummary(`Imported ${importMutation.data?.imported ?? 0} rows. Skipped ${importMutation.data?.skipped ?? 0}.`);
  };

  return (
    <AdminShell
      title="Bulk import"
      description="Upload CSV or Excel files to load questions and papers in bulk, with validation and duplicate detection."
      active="/secure-admin/bulk-import"
    >
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Bulk content upload</h2>
              <p className="text-sm text-muted-foreground">Upload a workbook or CSV file and validate rows before import.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
            <label className="block text-sm text-foreground">
              <span className="text-xs text-muted-foreground">Import type</span>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {importOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-foreground">
              <span className="text-xs text-muted-foreground">File</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-6 space-y-3">
            {warnings.map((warning, index) => (
              <div key={index} className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                {warning}
              </div>
            ))}
            {summary && <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">{summary}</div>}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="primary" onClick={submit} disabled={!file || importMutation.isLoading || !payload.length}>
              {importMutation.isLoading ? "Importing…" : "Import rows"}
            </Button>
            <Button variant="secondary" onClick={() => { setFile(null); setPreview([]); setWarnings([]); setSummary(null); }}>
              Reset file
            </Button>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">Preview</h3>
              <div className="text-xs text-muted-foreground">Showing first 10 rows</div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-background">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface text-muted-foreground">
                  <tr>
                    {(preview[0] ? Object.keys(preview[0]) : []).map((header) => (
                      <th key={header} className="px-3 py-2 font-medium uppercase tracking-wide">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} className="border-t border-border">
                      {Object.entries(row).map(([key, value]) => (
                        <td key={key} className="px-3 py-2 text-sm text-foreground">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {preview.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-sm text-muted-foreground" colSpan={6}>
                        Upload a CSV or Excel file to preview content.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Import guidance</h2>
              <p className="text-sm text-muted-foreground">Fields can be mapped automatically from header labels. For questions, use a pipe-separated options column.</p>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <strong>Questions</strong>
                <div>Required columns: question_text, subject, chapter, difficulty, options, correct_answer, question_type.</div>
              </div>
              <div>
                <strong>Papers</strong>
                <div>Required columns: title, pdf_url. Optional: year, category, attempt_as_test.</div>
              </div>
            </div>
            <div className="space-y-2">
              <Pill tone="info">CSV/Excel support</Pill>
              <Pill tone="warning">Duplicate detection</Pill>
              <Pill tone="success">Fast import preview</Pill>
            </div>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
