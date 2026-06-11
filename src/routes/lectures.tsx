import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Container, PageHeader } from "@/components/app-shell";
import { Card, Pill, Button, ProgressBar } from "@/components/ui-bits";
import { PlayCircle, CheckCircle2, Clock, ChevronRight, Notebook } from "lucide-react";
import { listPublicLectures } from "@/lib/api/content.functions";
import { useLectureProgressMap } from "@/lib/use-user-data";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";

export const Route = createFileRoute("/lectures")({
  head: () => ({
    meta: [
      { title: "Lectures — NeetForge" },
      {
        name: "description",
        content:
          "Chapter-wise video lessons with progress tracking, notes, and resume-from-anywhere.",
      },
    ],
  }),
  component: LecturesPage,
});

function LecturesPage() {
  const [subject, setSubject] = useState<string>("All");
  const { data: lectures, isLoading } = useQuery({
    queryKey: ["public-lectures"],
    queryFn: async () => await listPublicLectures({ data: {} }),
  });
  const { data: progressMap } = useLectureProgressMap();

  const lectureList = useMemo(() => {
    if (!lectures) return [];
    return lectures.map((lecture) => ({
      ...lecture,
      subject: lecture.subject ?? "General",
      chapter: lecture.chapter ?? "General",
    }));
  }, [lectures]);

  const subjects = useMemo(() => {
    const unique = new Set<string>(lectureList.map((lecture) => lecture.subject));
    return ["All", ...Array.from(unique)];
  }, [lectureList]);

  const filteredLectures = useMemo(() => {
    if (subject === "All") return lectureList;
    return lectureList.filter((lecture) => lecture.subject === subject);
  }, [lectureList, subject]);

  const resumeLecture = useMemo(() => {
    return lectureList.find((lecture) => {
      const progress = progressMap?.[lecture.id]?.progress_percent ?? 0;
      return progress > 0 && progress < 100;
    });
  }, [lectureList, progressMap]);

  return (
    <AppShell>
      <Container>
        <PageHeader
          title="Lectures"
          subtitle="Watch, take notes, and pick up where you left off."
        />

        {resumeLecture && (
          <Card className="mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0">
                  <PlayCircle className="size-6" />
                </div>
                <div>
                  <Pill tone="info">Continue learning</Pill>
                  <div className="font-semibold mt-1.5">{resumeLecture.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {resumeLecture.subject} · {resumeLecture.chapter} · {Math.ceil((resumeLecture.duration_seconds ?? 0) / 60)} min
                  </div>
                  <div className="mt-2 max-w-xs">
                    <ProgressBar value={progressMap?.[resumeLecture.id]?.progress_percent ?? 0} />
                  </div>
                </div>
              </div>
              <Button onClick={() => showToast("Coming Soon", "info")}>
                Resume <ChevronRight className="size-4" />
              </Button>
            </div>
          </Card>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap",
                subject === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-surface-2",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(isLoading ? Array.from({ length: 6 }) : filteredLectures).map((lecture, index) => {
            const isPlaceholder = isLoading;
            const item = lecture as typeof lectureList[number];
            const progress = progressMap?.[item.id]?.progress_percent ?? 0;
            return (
              <Card 
                key={isPlaceholder ? `placeholder-${index}` : item.id} 
                className="hover-lift"
                as={!isPlaceholder ? "button" : "div"}
                onClick={!isPlaceholder ? () => showToast("Coming Soon", "info") : undefined}
              >
                <div className="flex items-start gap-4">
                  <div className="size-16 rounded-xl bg-surface-2 grid place-items-center shrink-0 relative">
                    <PlayCircle className="size-6 text-primary" />
                    {progress === 100 && (
                      <div className="absolute -top-1 -right-1 size-5 rounded-full bg-success grid place-items-center">
                        <CheckCircle2 className="size-3.5 text-success-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill>{isPlaceholder ? "Loading" : item.subject}</Pill>
                      <Pill tone="info">{isPlaceholder ? "Chapter" : item.chapter}</Pill>
                    </div>
                    <div className="font-medium text-sm">{isPlaceholder ? "Loading…" : item.title}</div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {isPlaceholder ? "—" : `${Math.ceil((item.duration_seconds ?? 0) / 60)} min`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Notebook className="size-3" /> Notes
                      </span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar
                        value={isPlaceholder ? 0 : progress}
                        tone={progress === 100 ? "success" : "primary"}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </AppShell>
  );
}
