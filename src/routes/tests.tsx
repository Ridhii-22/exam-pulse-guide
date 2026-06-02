import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Container, PageHeader } from "@/components/app-shell";
import { Card, Pill, Button, ProgressBar } from "@/components/ui-bits";
import { BookOpen, History, Shuffle, Trophy, ChevronRight, Clock, Target } from "lucide-react";
import { subjects as fallbackSubjects, recentTests } from "@/lib/mock-data";
import { listPublicTests } from "@/lib/api/content.functions";

export const Route = createFileRoute("/tests")({
  head: () => ({
    meta: [
      { title: "Tests — NeetForge" },
      {
        name: "description",
        content: "Chapter tests, PYQs, random practice, and full-length NEET mock exams.",
      },
    ],
  }),
  component: TestsPage,
});

const categories = [
  {
    id: "chapter",
    title: "Chapter Wise Tests",
    desc: "Drill one chapter at a time",
    icon: BookOpen,
    defaultCount: "180+ chapters",
  },
  {
    id: "pyq",
    title: "PYQ Tests",
    desc: "NEET previous year papers",
    icon: History,
    defaultCount: "2014 – 2024",
  },
  {
    id: "random",
    title: "Random Practice",
    desc: "Mixed, randomised, timed",
    icon: Shuffle,
    defaultCount: "50k+ questions",
  },
  {
    id: "mock",
    title: "Full Mock Test",
    desc: "Real NEET CBT experience",
    icon: Trophy,
    defaultCount: "180 Qs · 200 min",
  },
];

function TestsPage() {
  const { data: tests, isLoading } = useQuery({
    queryKey: ["public-tests"],
    queryFn: async () => await listPublicTests({ data: {} }),
  });

  const availableTests = tests ?? [];
  const subjects = useMemo(() => {
    if (availableTests.length > 0) {
      return Array.from(new Set(availableTests.map((item) => item.subject ?? "General")));
    }
    return fallbackSubjects.map((s) => s.name);
  }, [availableTests]);

  const categoryData = categories.map((category) => {
    const count = availableTests.length
      ? availableTests.filter((item) => item.kind === category.id).length
      : undefined;
    return {
      ...category,
      count: count !== undefined ? `${count} available` : category.defaultCount,
    };
  });

  return (
    <AppShell>
      <Container>
        <PageHeader title="Tests" subtitle="Pick a mode. Stay focused." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {categoryData.map((c) => (
            <Card key={c.id} className="hover-lift group">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <c.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.title}</h3>
                    <Pill>{c.count}</Pill>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
                  <div className="mt-4">
                    {c.id === "mock" ? (
                      <Link to="/tests/mock">
                        <Button size="sm">
                          Start mock <ChevronRight className="size-3.5" />
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" variant="outline">
                        Open <ChevronRight className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Browse by subject
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <Card key={subject} className="hover-lift">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold truncate">{subject}</h3>
                    <Pill>{availableTests.filter((test) => (test.subject ?? "General") === subject).length}</Pill>
                  </div>
                  <div className="space-y-2 text-sm">
                    <Row icon={<BookOpen className="size-3.5" />} label="Chapter test" />
                    <Row icon={<History className="size-3.5" />} label="PYQ test" />
                    <Row icon={<Shuffle className="size-3.5" />} label="Random practice" />
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Explore <ChevronRight className="size-3.5" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <h3 className="font-semibold mb-4">Recent attempts</h3>
            <div className="space-y-4">
              {recentTests.map((t) => {
                const pct = Math.round((t.score / t.total) * 100);
                return (
                  <div key={t.id}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate pr-2">{t.title}</span>
                      <span className="text-muted-foreground shrink-0">{pct}%</span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar
                        value={pct}
                        tone={pct >= 75 ? "success" : pct >= 60 ? "primary" : "warning"}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {t.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="size-3" /> {t.score}/{t.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Container>
    </AppShell>
  );
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon} {label}
      </span>
      <ChevronRight className="size-3.5 text-muted-foreground" />
    </div>
  );
}
