import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Container, PageHeader } from "@/components/app-shell";
import { Card, Pill, Button, ProgressBar } from "@/components/ui-bits";
import { PlayCircle, CheckCircle2, Clock, ChevronRight, Notebook } from "lucide-react";
import { subjects, lectures } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lectures")({
  head: () => ({
    meta: [
      { title: "Lectures — NeetForge" },
      { name: "description", content: "Chapter-wise video lessons with progress tracking, notes, and resume-from-anywhere." },
    ],
  }),
  component: LecturesPage,
});

function LecturesPage() {
  const [subject, setSubject] = useState<string>("Physics");
  const list = lectures.filter((l) => l.subject === subject || subject === "All");
  const resume = lectures.find((l) => l.progress > 0 && l.progress < 100);

  return (
    <AppShell>
      <Container>
        <PageHeader title="Lectures" subtitle="Watch, take notes, and pick up where you left off." />

        {resume && (
          <Card className="mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0">
                  <PlayCircle className="size-6" />
                </div>
                <div>
                  <Pill tone="info">Continue learning</Pill>
                  <div className="font-semibold mt-1.5">{resume.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{resume.subject} · {resume.chapter} · {resume.duration}</div>
                  <div className="mt-2 max-w-xs"><ProgressBar value={resume.progress} /></div>
                </div>
              </div>
              <Button>Resume <ChevronRight className="size-4" /></Button>
            </div>
          </Card>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["All", ...subjects.map((s) => s.name)].map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap",
                subject === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-surface-2",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((l) => (
            <Card key={l.id} className="hover-lift">
              <div className="flex items-start gap-4">
                <div className="size-16 rounded-xl bg-surface-2 grid place-items-center shrink-0 relative">
                  <PlayCircle className="size-6 text-primary" />
                  {l.progress === 100 && (
                    <div className="absolute -top-1 -right-1 size-5 rounded-full bg-success grid place-items-center">
                      <CheckCircle2 className="size-3.5 text-success-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill>{l.subject}</Pill>
                    <Pill tone="info">{l.chapter}</Pill>
                  </div>
                  <div className="font-medium text-sm">{l.title}</div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {l.duration}</span>
                    <span className="flex items-center gap-1"><Notebook className="size-3" /> Notes</span>
                  </div>
                  <div className="mt-3"><ProgressBar value={l.progress} tone={l.progress === 100 ? "success" : "primary"} /></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </AppShell>
  );
}
