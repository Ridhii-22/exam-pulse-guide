import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Container, PageHeader } from "@/components/app-shell";
import { Card, Stat, Pill, ProgressBar, Button } from "@/components/ui-bits";
import { Flame, Target, Clock, TrendingUp, Award, BookCheck, Settings } from "lucide-react";
import { subjectProgress, weakChapters, badges } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — NeetForge" },
      { name: "description", content: "Your study analytics: streak, XP, accuracy, consistency heatmap, and achievement badges." },
    ],
  }),
  component: ProfilePage,
});

// Pseudo-heatmap data: 7 rows x 18 weeks
const heatmap = Array.from({ length: 7 }, (_, r) =>
  Array.from({ length: 18 }, (_, c) => (Math.sin(r * 1.3 + c * 0.7) + 1.2) * 1.5),
);

function ProfilePage() {
  return (
    <AppShell>
      <Container>
        <PageHeader
          title="Profile & Progress"
          subtitle="The numbers behind your prep."
          action={<Button variant="outline" size="sm"><Settings className="size-3.5" /> Settings</Button>}
        />

        {/* Identity */}
        <Card className="mb-6 flex flex-col md:flex-row md:items-center gap-5">
          <div className="size-16 rounded-2xl bg-primary/15 text-primary grid place-items-center text-xl font-semibold">A</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Aarav Sharma</h2>
              <Pill tone="info">Level 14</Pill>
            </div>
            <div className="text-sm text-muted-foreground">NEET 2026 aspirant · Joined Jan 2025</div>
            <div className="mt-3 max-w-md">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">XP to Level 15</span>
                <span className="font-medium">4,820 / 6,000</span>
              </div>
              <ProgressBar value={(4820 / 6000) * 100} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Stat label="Streak" value="12d" hint="Best: 21" icon={<Flame className="size-5" />} />
          <Stat label="Questions" value="5,470" hint="Solved" icon={<Target className="size-5" />} />
          <Stat label="Tests" value="86" hint="Attempted" icon={<BookCheck className="size-5" />} />
          <Stat label="Watch time" value="142h" hint="All-time" icon={<Clock className="size-5" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Heatmap */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Study consistency</h3>
              <Pill>Last 18 weeks</Pill>
            </div>
            <div className="grid grid-rows-7 grid-flow-col auto-cols-min gap-1 overflow-x-auto pb-1">
              {heatmap.flatMap((row, r) =>
                row.map((v, c) => {
                  const level = Math.min(4, Math.floor(v));
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={cn(
                        "size-3.5 rounded-sm",
                        level === 0 && "bg-surface-2",
                        level === 1 && "bg-primary/25",
                        level === 2 && "bg-primary/50",
                        level === 3 && "bg-primary/75",
                        level === 4 && "bg-primary",
                      )}
                    />
                  );
                }),
              )}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-3 text-[11px] text-muted-foreground">
              Less
              <span className="size-3 rounded-sm bg-surface-2" />
              <span className="size-3 rounded-sm bg-primary/25" />
              <span className="size-3 rounded-sm bg-primary/50" />
              <span className="size-3 rounded-sm bg-primary/75" />
              <span className="size-3 rounded-sm bg-primary" />
              More
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Award className="size-4 text-warning" /> Achievements</h3>
            <div className="space-y-3">
              {badges.map((b) => (
                <div key={b.name} className={cn("flex items-center gap-3 p-2 rounded-lg", b.earned ? "bg-surface-2" : "opacity-50")}>
                  <div className={cn("size-9 rounded-lg grid place-items-center", b.earned ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground")}>
                    <Award className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{b.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{b.desc}</div>
                  </div>
                  {b.earned && <Pill tone="success">✓</Pill>}
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Subject mastery</h3>
              <Pill><TrendingUp className="size-3" /> Trending up</Pill>
            </div>
            <div className="space-y-4">
              {subjectProgress.map((s) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{s.subject}</span>
                    <span className="text-muted-foreground">{s.accuracy}% accuracy</span>
                  </div>
                  <ProgressBar value={s.accuracy} tone={s.accuracy > 75 ? "success" : s.accuracy > 60 ? "primary" : "warning"} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">Weak chapters</h3>
            <div className="space-y-3">
              {weakChapters.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.subject}</div>
                  </div>
                  <Pill tone="danger">{c.accuracy}%</Pill>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Container>
    </AppShell>
  );
}
