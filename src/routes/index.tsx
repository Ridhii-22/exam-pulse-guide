import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Container, PageHeader } from "@/components/app-shell";
import { Card, Stat, ProgressBar, Pill, Button } from "@/components/ui-bits";
import { Flame, Target, Clock, TrendingUp, ChevronRight, ClipboardList, FileText, PlayCircle, ArrowRight, Sparkles } from "lucide-react";
import { subjectProgress, recentTests, weakChapters, dailyGoals, activity } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — NeetForge" },
      { name: "description", content: "Your personalised NEET prep dashboard: streaks, weak chapters, daily goals, and progress." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <AppShell>
      <Container>
        <PageHeader
          title="Welcome back, Aarav"
          subtitle="You're on a 12-day streak. Let's keep the momentum."
          action={
            <Link to="/tests">
              <Button variant="primary">Continue studying <ArrowRight className="size-4" /></Button>
            </Link>
          }
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <Stat label="Streak" value="12 days" hint="Personal best: 21" icon={<Flame className="size-5" />} />
          <Stat label="Accuracy" value="74%" hint="+3% this week" icon={<Target className="size-5" />} />
          <Stat label="Study time" value="38h" hint="This week" icon={<Clock className="size-5" />} />
          <Stat label="XP" value="4,820" hint="Level 14" icon={<TrendingUp className="size-5" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Continue + Quick access */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-info/5 pointer-events-none" />
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <Pill tone="info"><Sparkles className="size-3" /> Continue</Pill>
                  <h3 className="text-lg font-semibold mt-2">Thermodynamics — Heat Engines</h3>
                  <p className="text-sm text-muted-foreground mt-1">Lecture 4 of 7 · 65% complete</p>
                  <div className="mt-3 max-w-xs"><ProgressBar value={65} /></div>
                </div>
                <Link to="/lectures">
                  <Button>Resume <ChevronRight className="size-4" /></Button>
                </Link>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickAccess to="/tests" icon={<ClipboardList className="size-5" />} title="Tests" desc="Chapter, PYQ, Mock" />
              <QuickAccess to="/papers" icon={<FileText className="size-5" />} title="Papers" desc="PDFs & PYQs" />
              <QuickAccess to="/lectures" icon={<PlayCircle className="size-5" />} title="Lectures" desc="Watch & resume" />
            </div>

            {/* Subject progress */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Subject progress</h3>
                <Pill>This month</Pill>
              </div>
              <div className="space-y-4">
                {subjectProgress.map((s) => (
                  <div key={s.subject}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">{s.subject}</span>
                      <span className="text-muted-foreground">{s.solved.toLocaleString()} / {s.total.toLocaleString()} · {s.accuracy}%</span>
                    </div>
                    <ProgressBar value={(s.solved / s.total) * 100} tone={s.accuracy > 75 ? "success" : s.accuracy > 60 ? "primary" : "warning"} />
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent tests */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent tests</h3>
                <Link to="/tests" className="text-xs text-primary hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-border">
                {recentTests.map((t) => {
                  const pct = Math.round((t.score / t.total) * 100);
                  return (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground">{t.date}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold">{t.score}/{t.total}</div>
                          <div className="text-[11px] text-muted-foreground">{pct}%</div>
                        </div>
                        <Pill tone={pct >= 75 ? "success" : pct >= 60 ? "info" : "warning"}>{pct}%</Pill>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Side column */}
          <div className="space-y-5">
            <Card>
              <h3 className="font-semibold mb-4">Daily goals</h3>
              <div className="space-y-4">
                {dailyGoals.map((g) => (
                  <div key={g.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span>{g.label}</span>
                      <span className="text-muted-foreground">{g.progress}/{g.total}</span>
                    </div>
                    <ProgressBar value={(g.progress / g.total) * 100} tone={g.progress >= g.total ? "success" : "primary"} />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-3">Weak chapters</h3>
              <div className="space-y-3">
                {weakChapters.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.subject}</div>
                    </div>
                    <Pill tone="danger">{c.accuracy}%</Pill>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">Start revision <ChevronRight className="size-3.5" /></Button>
            </Card>

            <Card>
              <h3 className="font-semibold mb-3">This week</h3>
              <div className="flex items-end gap-2 h-24">
                {activity.map((a) => (
                  <div key={a.day} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full rounded-md bg-primary/70 hover:bg-primary transition" style={{ height: `${(a.value / 6) * 100}%` }} />
                    <div className="text-[10px] text-muted-foreground">{a.day}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </AppShell>
  );
}

function QuickAccess({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="card-soft p-4 hover-lift block">
      <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-3">{icon}</div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}
