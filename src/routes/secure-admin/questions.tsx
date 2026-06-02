import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { Button, Card, Pill } from "@/components/ui-bits";
import {
  adminBulkUploadQuestions,
  adminDeleteQuestion,
  adminListQuestions,
  adminUpsertQuestion,
} from "@/lib/api/admin.functions";

export const Route = createFileRoute("/secure-admin/questions")({
  head: () => ({ meta: [{ title: "Manage Questions — NeetForge" }] }),
  component: AdminQuestions,
});

const defaultQuestion = {
  subject: "",
  chapter: "",
  topic: "",
  difficulty: "medium",
  question_text: "",
  options: ["", ""],
  correct_answer: "",
  explanation: "",
  year: "",
  question_type: "single_choice",
};

function parseBulkQuestions(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const rows = text
          .trim()
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => line.split(",").map((cell) => cell.trim()));

        const header = rows.shift();
        if (!header) {
          return resolve([]);
        }

        const items = rows.map((values) => {
          const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""]));
          return {
            subject: row.subject || "",
            chapter: row.chapter || "",
            topic: row.topic || "",
            difficulty: row.difficulty || "medium",
            question_text: row.question_text || "",
            options: row.options ? row.options.split("|").map((opt: string) => opt.trim()) : ["", ""],
            correct_answer: row.correct_answer || "",
            explanation: row.explanation || "",
            year: row.year || "",
            question_type: row.question_type || "single_choice",
          };
        });

        resolve(items);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function AdminQuestions() {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [questionTypeFilter, setQuestionTypeFilter] = useState("");
  const [activeItem, setActiveItem] = useState<any>(null);
  const [formData, setFormData] = useState(defaultQuestion);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-questions", search],
    queryFn: async () => await adminListQuestions({ data: { search } }),
  });

  const saveMutation = useMutation({
    mutationFn: async (item: any) => await adminUpsertQuestion({ data: { item } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      setFormData(defaultQuestion);
      setActiveItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await adminDeleteQuestion({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-questions"] }),
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (items: any[]) => await adminBulkUploadQuestions({ data: { items } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      setBulkFile(null);
    },
  });

  const subjectOptions = useMemo(() => Array.from(new Set((data ?? []).map((item: any) => item.subject).filter(Boolean))), [data]);

  const filteredQuestions = useMemo(() => {
    return (data ?? []).filter((item: any) => {
      const matchesSearch = search
        ? [item.question_text, item.subject, item.chapter, item.topic, item.year]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
        : true;
      const matchesSubject = subjectFilter ? item.subject === subjectFilter : true;
      const matchesChapter = chapterFilter ? item.chapter === chapterFilter : true;
      const matchesDifficulty = difficultyFilter ? item.difficulty === difficultyFilter : true;
      const matchesType = questionTypeFilter ? item.question_type === questionTypeFilter : true;
      return matchesSearch && matchesSubject && matchesChapter && matchesDifficulty && matchesType;
    });
  }, [data, search, subjectFilter, chapterFilter, difficultyFilter, questionTypeFilter]);

  const beginEdit = (item: any) => {
    setActiveItem(item);
    setFormData({
      subject: item.subject,
      chapter: item.chapter,
      topic: item.topic,
      difficulty: item.difficulty,
      question_text: item.question_text,
      options: item.options ?? ["", ""],
      correct_answer: item.correct_answer,
      explanation: item.explanation ?? "",
      year: item.year ?? "",
      question_type: item.question_type ?? "single_choice",
    });
  };

  const updateOption = (index: number, value: string) => {
    setFormData((prev) => {
      const options = [...prev.options];
      options[index] = value;
      return { ...prev, options };
    });
  };

  const addOption = () => setFormData((prev) => ({ ...prev, options: [...prev.options, ""] }));
  const removeOption = (index: number) => setFormData((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));

  return (
    <AdminShell
      title="Question management"
      description="Create, edit, and organize NEET questions for chapter tests, PYQs, and practice modules."
      active="/secure-admin/questions"
    >
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Question bank</h2>
              <p className="text-sm text-muted-foreground">Search and manage reusable questions across content types.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveItem(null);
                  setFormData(defaultQuestion);
                }}
              >
                Add new question
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by question, subject, chapter"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:max-w-md"
              />
              <div className="flex gap-2 flex-wrap">
                {subjectOptions.slice(0, 4).map((subject) => (
                  <Pill key={subject}>{subject}</Pill>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All subjects</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              <input
                value={chapterFilter}
                onChange={(e) => setChapterFilter(e.target.value)}
                placeholder="Filter by chapter"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Any difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                value={questionTypeFilter}
                onChange={(e) => setQuestionTypeFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Any type</option>
                <option value="single_choice">Single choice</option>
                <option value="multiple_choice">Multiple choice</option>
                <option value="true_false">True / False</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Bulk upload</p>
                <p className="text-xs text-muted-foreground">Upload a CSV file with question rows and pipe-separated options.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                />
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (!bulkFile) return;
                    const items = await parseBulkQuestions(bulkFile);
                    bulkUploadMutation.mutate(items);
                  }}
                  disabled={!bulkFile || bulkUploadMutation.status === "pending"}
                >
                  Upload questions
                </Button>
              </div>
            </div>
            {bulkUploadMutation.error && (
              <p className="text-sm text-destructive mt-2">Unable to upload questions. Check the file format.</p>
            )}
            {bulkUploadMutation.status === "pending" && <p className="text-sm text-muted-foreground mt-2">Uploading questions…</p>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-surface text-sm uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Chapter</th>
                  <th className="px-3 py-2">Difficulty</th>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((item: any) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-3 text-sm">{item.subject}</td>
                    <td className="px-3 py-3 text-sm">{item.chapter}</td>
                    <td className="px-3 py-3 text-sm">{item.difficulty}</td>
                    <td className="px-3 py-3 text-sm">{item.year || "—"}</td>
                    <td className="px-3 py-3 text-sm flex gap-2 flex-wrap">
                      <Button variant="ghost" size="sm" onClick={() => beginEdit(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.status === "pending"}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredQuestions.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No matching questions found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {isLoading && <p className="text-sm text-muted-foreground mt-3">Loading saved questions…</p>}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-lg font-semibold">{activeItem ? "Edit question" : "Create question"}</h2>
              <p className="text-sm text-muted-foreground">Questions saved here are reusable across tests and papers.</p>
            </div>
            <span className="rounded-full border border-border px-2 py-1 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {activeItem ? "Editing" : "Draft"}
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Subject" value={formData.subject} onChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))} />
              <Field label="Chapter" value={formData.chapter} onChange={(value) => setFormData((prev) => ({ ...prev, chapter: value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Topic" value={formData.topic} onChange={(value) => setFormData((prev) => ({ ...prev, topic: value }))} />
              <Field label="Difficulty" value={formData.difficulty} onChange={(value) => setFormData((prev) => ({ ...prev, difficulty: value }))} />
            </div>
            <TextArea label="Question text" value={formData.question_text} onChange={(value) => setFormData((prev) => ({ ...prev, question_text: value }))} />
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder={`Option ${index + 1}`}
                  />
                  {formData.options.length > 2 ? (
                    <button type="button" className="text-destructive text-sm" onClick={() => removeOption(index)}>
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
              <button type="button" className="text-sm text-primary hover:underline" onClick={addOption}>
                + Add option
              </button>
            </div>
            <Field label="Correct answer" value={formData.correct_answer} onChange={(value) => setFormData((prev) => ({ ...prev, correct_answer: value }))} />
            <TextArea label="Explanation" value={formData.explanation} onChange={(value) => setFormData((prev) => ({ ...prev, explanation: value }))} rows={4} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Year / tag" value={formData.year} onChange={(value) => setFormData((prev) => ({ ...prev, year: value }))} />
              <Field label="Question type" value={formData.question_type} onChange={(value) => setFormData((prev) => ({ ...prev, question_type: value }))} />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button variant="primary" onClick={() => saveMutation.mutate({ ...activeItem, ...formData })} disabled={saveMutation.status === "pending"}>
                {activeItem ? "Save changes" : "Create question"}
              </Button>
              <Button variant="secondary" onClick={() => { setActiveItem(null); setFormData(defaultQuestion); }}>Reset form</Button>
            </div>
            {saveMutation.error && <p className="text-sm text-destructive">Unable to save question.</p>}
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

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-sm text-foreground">
      <span className="text-xs text-muted-foreground">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </label>
  );
}
