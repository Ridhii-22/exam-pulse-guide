import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Container, PageHeader } from "@/components/app-shell";
import { Card, Pill, Button } from "@/components/ui-bits";
import { FileText, Download, Eye, Play } from "lucide-react";
import { papers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/papers")({
  head: () => ({
    meta: [
      { title: "Papers — NeetForge" },
      { name: "description", content: "Browse NEET PYQs, coaching tests, full mocks, and sample papers. View, download, or attempt as test." },
    ],
  }),
  component: PapersPage,
});

const FILTERS = ["All", "Previous Year", "Coaching", "Mock", "Sample"] as const;

function PapersPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const list = papers.filter((p) => filter === "All" || p.type === filter);

  return (
    <AppShell>
      <Container>
        <PageHeader title="Papers" subtitle="Curated PDFs and PYQ collections — view, download, or attempt as a timed test." />

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap",
                filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-surface-2",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((p) => (
            <Card key={p.id} className="hover-lift flex flex-col">
              <div className="flex items-start gap-3 mb-4">
                <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{p.title}</div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <Pill tone="info">{p.type}</Pill>
                    <Pill>{p.year}</Pill>
                    <Pill>{p.pages}p</Pill>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <Button size="sm" variant="outline" className="flex-1"><Eye className="size-3.5" /> View</Button>
                <Button size="sm" variant="ghost"><Download className="size-3.5" /></Button>
                <Button size="sm" variant="primary"><Play className="size-3.5" /> Attempt</Button>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </AppShell>
  );
}
