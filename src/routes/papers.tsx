import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Container, PageHeader } from "@/components/app-shell";
import { Card, Pill, Button } from "@/components/ui-bits";
import { FileText, Download, Eye, Play } from "lucide-react";
import { listPublicPapers } from "@/lib/api/content.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/papers")({
  head: () => ({
    meta: [
      { title: "Papers — NeetForge" },
      {
        name: "description",
        content:
          "Browse NEET PYQs, coaching tests, full mocks, and sample papers. View, download, or attempt as test.",
      },
    ],
  }),
  component: PapersPage,
});

function PapersPage() {
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedPaperType, setSelectedPaperType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [uniqueYears, setUniqueYears] = useState<string[]>([]);
  const [uniquePaperTypes, setUniquePaperTypes] = useState<string[]>([]);
  const [uniqueSubjects, setUniqueSubjects] = useState<string[]>([]);
  const [uniqueChapters, setUniqueChapters] = useState<string[]>([]);

  const { data: papers, isLoading } = useQuery({
    queryKey: ["public-papers", selectedPaperType, selectedSubject, selectedChapter, selectedYear],
    queryFn: async () => await listPublicPapers({
      data: {
        paper_type: selectedPaperType || undefined,
        subject: selectedSubject || undefined,
        chapter: selectedChapter || undefined,
        year: selectedYear || undefined,
      },
    }),
  });

  useEffect(() => {
    if (papers) {
      const years = Array.from(new Set(papers.map((p: any) => p.year).filter(Boolean)));
      const paperTypes = Array.from(new Set(papers.map((p: any) => p.paper_type).filter(Boolean)));
      const subjects = Array.from(new Set(papers.map((p: any) => p.subject).filter(Boolean)));
      const chapters = Array.from(new Set(papers.map((p: any) => p.chapter).filter(Boolean)));
      setUniqueYears(years as string[]);
      setUniquePaperTypes(paperTypes as string[]);
      setUniqueSubjects(subjects as string[]);
      setUniqueChapters(chapters as string[]);
    }
  }, [papers]);

  const paperList = useMemo(() => {
    if (!papers || papers.length === 0) return [];
    return papers;
  }, [papers]);

  const filteredPapers = paperList.filter((p: any) => {
    let matches = true;
    if (search) {
      matches = p.title.toLowerCase().includes(search.toLowerCase());
    }
    return matches;
  });

  const displayPapers = isLoading ? Array.from({ length: 6 }) : filteredPapers;

  return (
    <AppShell>
      <Container>
        <PageHeader
          title="Papers"
          subtitle="Curated PDFs and PYQ collections — view, download, or attempt as a timed test."
        />

        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Search papers by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={selectedPaperType}
              onChange={(e) => setSelectedPaperType(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Types</option>
              {uniquePaperTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              disabled={!selectedSubject}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">All Chapters</option>
              {uniqueChapters.map((chapter) => (
                <option key={chapter} value={chapter}>{chapter}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Years</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {(search || selectedPaperType || selectedSubject || selectedChapter || selectedYear) && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedPaperType("");
                setSelectedSubject("");
                setSelectedChapter("");
                setSelectedYear("");
              }}
              className="text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayPapers.map((paper, index) => {
            const isPlaceholder = isLoading;
            const item = paper as typeof paperList[number];
            return (
              <Card key={isPlaceholder ? `placeholder-${index}` : item.id} className="hover-lift flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {isPlaceholder ? "Loading…" : item.title}
                    </div>
                    {!isPlaceholder && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <Pill tone="info">{item.paper_type}</Pill>
                        <Pill>{item.subject}</Pill>
                        {item.chapter && <Pill tone="warning">{item.chapter}</Pill>}
                        <Pill>{item.year}</Pill>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-auto">
                  <a
                    href={isPlaceholder ? undefined : item.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-surface-2",
                      isPlaceholder ? "cursor-not-allowed text-muted-foreground" : "text-foreground",
                    )}
                  >
                    <Eye className="size-3.5" /> View
                  </a>
                  <a
                    href={isPlaceholder ? undefined : item.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition hover:bg-surface-2",
                      isPlaceholder ? "cursor-not-allowed text-muted-foreground" : "text-foreground",
                    )}
                  >
                    <Download className="size-3.5" />
                  </a>
                  <Button size="sm" variant="primary" disabled={isPlaceholder || !item.attempt_as_test}>
                    <Play className="size-3.5" /> Attempt
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </AppShell>
  );
}
