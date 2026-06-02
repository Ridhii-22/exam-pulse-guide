import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Container, PageHeader } from "@/components/app-shell";
import { Card, Stat, ProgressBar, Pill, Button } from "@/components/ui-bits";
import {
  Flame,
  Target,
  Clock,
  TrendingUp,
  ChevronRight,
  ClipboardList,
  FileText,
  PlayCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useDashboardData } from "@/lib/use-user-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — NeetForge" },
      {
        name: "description",
        content:
          "Your personalised NEET prep dashboard: streaks, weak chapters, daily goals, and progress.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data } = useDashboardData();
  const firstName = (data?.profile?.full_name ?? "").split(" ")[0] || "back";
  const streak = data?.streak ?? 0;
  const accuracy = data?.avgAccuracy ?? 0;
  const studyHours = data?.studyHours ?? 0;
  const xp = data?.profile?.xp ?? 0;
  const level = data?.profile?.level ?? 1;
  const testsAttempted = data?.testsAttempted ?? 0;
  const papersSolved = data?.papersSolved ?? 0;
  const videosCompleted = data?.videosCompleted ?? 0;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const recent7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const row = data?.activity.find((a) => a.activity_date === iso);
    return { day: days[d.getDay()], value: row?.questions_solved ?? 0 };
  });
  const weekly = recent7;
  const maxV = Math.max(1, ...weekly.map((w) => w.value));

  const subjectRows = data?.subjectAccuracy?.length
    ? data.subjectAccuracy.map((s) => ({
        subject: s.subject,
        solved: s.solved,
        total: Math.max(s.solved, 100),
        accuracy: s.accuracy,
      }))
    : [];

  const recentTests = data?.tests ?? [];
  const weak = data?.weakChapters ?? [];
  const showAnalytics = testsAttempted > 0;
  const todaysQuestions = data?.activity.find((a) => a.activity_date === todayIso)?.questions_solved ?? 0;
  const dailyGoals = [
    { label: "Questions", progress: todaysQuestions, total: 20 },
    { label: "Lectures", progress: videosCompleted, total: 5 },
    { label: "Tests", progress: testsAttempted, total: 3 },
  ];

  return (
    <AppShell>
      <Container>
        <PageHeader
          title={`Welcome${firstName === "back" ? " back" : `, ${firstName}`}`}
          subtitle={
            streak > 0
              ? `You're on a ${streak}-day streak. Let's keep the momentum.`
              : "Start a session today to begin your streak."
          }
          action={
            <Link to="/tests">
              <Button variant="primary">
                Continue studying <ArrowRight className="size-4" />
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <Stat label="Streak" value={`${streak} days`} icon={<Flame className="size-5" />} />
          <Stat
            label="Accuracy"
            value={`${accuracy}%`}
            hint="All-time"
            icon={<Target className="size-5" />}
          />
          <Stat
            label="Study time"
            value={`${studyHours}h`}
            hint="All-time"
            icon={<Clock className="size-5" />}
          />
          <Stat
            label="XP"
            value={xp.toLocaleString()}
            hint={`Level ${level}`}
            icon={<TrendingUp className="size-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-info/5 pointer-events-none" />
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <Pill tone="info">
                    <Sparkles className="size-3" /> Continue
                  </Pill>
                  <h3 className="text-lg font-semibold mt-2">Pick up where you left off</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Resume a lecture or jump into a quick test.
                  </p>
                </div>
                <Link to="/lectures">
                  <Button>
                    Browse lectures <ChevronRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickAccess
                to="/tests"
                icon={<ClipboardList className="size-5" />}
                title="Tests"
                desc="Chapter, PYQ, Mock"
              />
              <QuickAccess
                to="/papers"
                icon={<FileText className="size-5" />}
                title="Papers"
                desc={papersSolved > 0 ? `${papersSolved} solved` : "No papers solved yet."}
              />
              <QuickAccess
                to="/lectures"
                icon={<PlayCircle className="size-5" />}
                title="Lectures"
                desc={videosCompleted > 0 ? `${videosCompleted} completed` : "No lectures completed yet."}
              />
            </div>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Subject progress</h3>
                <Pill>All-time</Pill>
              </div>
              <div className="space-y-4">
                {subjectRows.length > 0 ? (
                  subjectRows.map((s) => (
                    <div key={s.subject}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium">{s.subject}</span>
                        <span className="text-muted-foreground">
                          {s.solved.toLocaleString()} solved · {s.accuracy}%
                        </span>
                      </div>
                      <ProgressBar
                        value={s.accuracy}
                        tone={s.accuracy > 75 ? "success" : s.accuracy > 60 ? "primary" : "warning"}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Start your NEET journey today.
                  </p>
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent tests</h3>
                <Link to="/tests" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
              {recentTests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tests attempted yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentTests.slice(0, 5).map((t) => {
                    const pct = Math.round(Number(t.accuracy));
                    return (
                      <div key={t.id} className="flex items-center justify-between py-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{t.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(t.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {t.score}/{t.total}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{pct}%</div>
                          </div>
                          <Pill tone={pct >= 75 ? "success" : pct >= 60 ? "info" : "warning"}>
                            {pct}%
                          </Pill>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <h3 className="font-semibold mb-4">Daily goals</h3>
              <div className="space-y-4">
                {dailyGoals.map((g) => (
                  <div key={g.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span>{g.label}</span>
                      <span className="text-muted-foreground">
                        {g.progress}/{g.total}
                      </span>
                    </div>
                    <ProgressBar
                      value={(g.progress / g.total) * 100}
                      tone={g.progress >= g.total ? "success" : "primary"}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-3">Weak chapters</h3>
              {weak.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Not enough data yet. Attempt a few tests to generate insights.
                </p>
              ) : (
                <div className="space-y-3">
                  {weak.map((c) => (
                    <div key={c.name} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.subject}</div>
                      </div>
                      <Pill tone="danger">{c.accuracy}%</Pill>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full mt-4">
                Start revision <ChevronRight className="size-3.5" />
              </Button>
            </Card>

            <Card>
              <h3 className="font-semibold mb-3">This week</h3>
              {showAnalytics ? (
                <div className="flex items-end gap-2 h-24">
                  {weekly.map((a, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-md bg-primary/70 hover:bg-primary transition"
                        style={{ height: `${Math.max(4, (a.value / maxV) * 100)}%` }}
                      />
                      <div className="text-[10px] text-muted-foreground">{a.day}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not enough data yet. Attempt a few tests to generate insights.
                </p>
              )}
            </Card>
          </div>
        </div>
      </Container>
    </AppShell>
  );
}

function QuickAccess({
  to,
  icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link to={to} className="card-soft p-4 hover-lift block">
      <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-3">
        {icon}
      </div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}
