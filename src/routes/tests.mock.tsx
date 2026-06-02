import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Flag, Save, Clock, X } from "lucide-react";
import { Button, Pill } from "@/components/ui-bits";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth-guard";
import { recordTestAttempt } from "@/lib/tracker";

export const Route = createFileRoute("/tests/mock")({
  head: () => ({
    meta: [
      { title: "Full Mock Test — NeetForge" },
      {
        name: "description",
        content: "Real NEET CBT experience with question palette, timer, and review mode.",
      },
    ],
  }),
  component: MockTestPage,
});

type Status = "not-visited" | "not-answered" | "answered" | "marked" | "answered-marked";

const SECTIONS = ["Physics", "Chemistry", "Biology"] as const;
const PER_SECTION = 15;

function buildQuestions() {
  const out: {
    id: number;
    section: (typeof SECTIONS)[number];
    text: string;
    options: string[];
    correct: number;
  }[] = [];
  let i = 1;
  for (const s of SECTIONS) {
    for (let q = 1; q <= PER_SECTION; q++) {
      out.push({
        id: i++,
        section: s,
        text: `${s} Q${q}. Sample question text demonstrating the focused exam interface and clean typography.`,
        options: [
          "Option A — concise plausible distractor",
          "Option B — concise plausible distractor",
          "Option C — concise plausible distractor",
          "Option D — concise plausible distractor",
        ],
        correct: (q * 7) % 4,
      });
    }
  }
  return out;
}

function MockTestPage() {
  return (
    <AuthGuard>
      <MockTestInner />
    </AuthGuard>
  );
}

function MockTestInner() {
  const questions = useMemo(buildQuestions, []);
  const navigate = useNavigate();
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("Physics");
  const sectionQs = questions.filter((q) => q.section === section);
  const [activeId, setActiveId] = useState(sectionQs[0].id);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Record<number, boolean>>({});
  const [visited, setVisited] = useState<Record<number, boolean>>({ [sectionQs[0].id]: true });
  const [seconds, setSeconds] = useState(60 * 60); // 60 min demo
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useMemo(() => Date.now(), []);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const submit = async () => {
    setSubmitting(true);
    let score = 0;
    const qResults = questions.map((q) => {
      const a = answers[q.id];
      const skipped = a === undefined;
      const is_correct = !skipped && a === q.correct;
      if (is_correct) score++;
      return { subject: q.section, chapter: `${q.section} Mock`, is_correct, skipped };
    });
    await recordTestAttempt({
      title: "NEET Full Mock 07",
      kind: "mock",
      score,
      total: questions.length,
      time_taken_seconds: Math.round((Date.now() - startedAt) / 1000),
      questions: qResults,
    });
    navigate({ to: "/tests" });
  };

  const active = questions.find((q) => q.id === activeId)!;

  const statusOf = (qid: number): Status => {
    const a = answers[qid] !== undefined;
    const m = marked[qid];
    if (a && m) return "answered-marked";
    if (m) return "marked";
    if (a) return "answered";
    if (visited[qid]) return "not-answered";
    return "not-visited";
  };

  const goTo = (qid: number) => {
    setVisited((v) => ({ ...v, [qid]: true }));
    setActiveId(qid);
    const q = questions.find((x) => x.id === qid)!;
    if (q.section !== section) setSection(q.section);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-surface px-4 lg:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/tests"
            className="size-9 grid place-items-center rounded-lg hover:bg-surface-2 transition"
          >
            <X className="size-4" />
          </Link>
          <div>
            <div className="text-sm font-semibold leading-none">NEET Full Mock 07</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Section: {section}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 font-mono text-sm">
          <Clock className="size-4 text-primary" /> {mm}:{ss}
        </div>
      </header>

      {/* Section tabs */}
      <div className="border-b border-border bg-background px-4 lg:px-6 flex gap-1 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setSection(s);
              const first = questions.find((q) => q.section === s)!;
              goTo(first.id);
            }}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              section === s
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-0">
        {/* Question area */}
        <div className="p-4 lg:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <Pill>
              Question {sectionQs.findIndex((q) => q.id === active.id) + 1} of {PER_SECTION}
            </Pill>
            <Pill tone="info">+4 / -1</Pill>
          </div>
          <p className="text-base md:text-lg leading-relaxed">{active.text}</p>

          <div className="mt-6 space-y-2 max-w-2xl">
            {active.options.map((opt, idx) => {
              const selected = answers[active.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setAnswers((a) => ({ ...a, [active.id]: idx }))}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-surface-2",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "size-6 rounded-full grid place-items-center text-xs font-semibold border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm">{opt}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-6 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const i = sectionQs.findIndex((q) => q.id === active.id);
                if (i > 0) goTo(sectionQs[i - 1].id);
              }}
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setMarked((m) => ({ ...m, [active.id]: !m[active.id] }))}
            >
              <Flag className="size-4" /> {marked[active.id] ? "Unmark" : "Mark for review"}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setAnswers((a) => {
                  const n = { ...a };
                  delete n[active.id];
                  return n;
                })
              }
            >
              Clear
            </Button>
            <div className="flex-1" />
            <Button
              onClick={() => {
                const i = sectionQs.findIndex((q) => q.id === active.id);
                if (i < sectionQs.length - 1) goTo(sectionQs[i + 1].id);
              }}
            >
              <Save className="size-4" /> Save & Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Palette */}
        <aside className="border-t lg:border-t-0 lg:border-l border-border bg-surface p-4 lg:p-5 overflow-y-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Question palette
          </div>
          <div className="grid grid-cols-6 lg:grid-cols-5 gap-2">
            {sectionQs.map((q, i) => {
              const st = statusOf(q.id);
              const styles: Record<Status, string> = {
                "not-visited": "bg-surface-2 text-muted-foreground border-border",
                "not-answered": "bg-destructive/15 text-destructive border-destructive/30",
                answered: "bg-success/15 text-success border-success/30",
                marked: "bg-info/15 text-info border-info/30",
                "answered-marked": "bg-primary/15 text-primary border-primary/40",
              };
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(q.id)}
                  className={cn(
                    "h-10 rounded-lg text-xs font-semibold border transition",
                    styles[st],
                    active.id === q.id && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-5 space-y-2 text-xs">
            <Legend tone="success" label="Answered" />
            <Legend tone="danger" label="Not answered" />
            <Legend tone="info" label="Marked" />
            <Legend tone="primary" label="Answered & marked" />
            <Legend tone="muted" label="Not visited" />
          </div>
          <Button className="w-full mt-6" variant="primary" disabled={submitting} onClick={submit}>
            {submitting ? "Submitting…" : "Submit test"}
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Legend({
  tone,
  label,
}: {
  tone: "success" | "danger" | "info" | "primary" | "muted";
  label: string;
}) {
  const map: Record<string, string> = {
    success: "bg-success",
    danger: "bg-destructive",
    info: "bg-info",
    primary: "bg-primary",
    muted: "bg-surface-2 border border-border",
  };
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className={cn("size-3 rounded", map[tone])} />
      {label}
    </div>
  );
}
