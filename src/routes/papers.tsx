import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, Container, PageHeader } from "@/components/app-shell";
import { Card, Pill, Button } from "@/components/ui-bits";
import { FileText, Download, Eye, Play, Star, Check, Bookmark } from "lucide-react";
import { listPublicPapers } from "@/lib/api/content.functions";
import { addBookmark, removeBookmark, markPaperCompleted, getPaperProgress, listBookmarks, trackPaperView, trackPaperDownload } from "@/lib/api/student.functions";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";

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
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedPaperType, setSelectedPaperType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [uniqueYears, setUniqueYears] = useState<string[]>([]);
  const [uniquePaperTypes, setUniquePaperTypes] = useState<string[]>([]);
  const [uniqueSubjects, setUniqueSubjects] = useState<string[]>([]);
  const [uniqueChapters, setUniqueChapters] = useState<string[]>([]);

  // Fetch user's paper progress
  const { data: userProgress } = useQuery({
    queryKey: ["paper-progress", session?.access_token],
    queryFn: async () => session ? await getPaperProgress({ data: { sessionToken: session.access_token } }) : [],
    enabled: !!session,
  });

  // Fetch user's bookmarks
  const { data: bookmarks } = useQuery({
    queryKey: ["bookmarks", session?.access_token],
    queryFn: async () => session ? await listBookmarks({ data: { sessionToken: session.access_token, itemType: "paper" } }) : [],
    enabled: !!session,
  });

  const bookmarkedPaperIds = useMemo(() => {
    return new Set(bookmarks?.map((b: any) => b.item_id) || []);
  }, [bookmarks]);

  const completedPaperIds = useMemo(() => {
    return new Set(userProgress?.filter((p: any) => p.completed).map((p: any) => p.paper_id) || []);
  }, [userProgress]);

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ itemId, action }: { itemId: string; action: "add" | "remove" }) => {
      if (!session?.access_token) return;
      if (action === "add") {
        await addBookmark({ data: { itemId, itemType: "paper", sessionToken: session.access_token } });
      } else {
        await removeBookmark({ data: { itemId, itemType: "paper", sessionToken: session.access_token } });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarked-papers"] });
      queryClient.invalidateQueries({ queryKey: ["paper-statistics"] });
      showToast(
        variables.action === "add" ? "Added to Bookmarks" : "Removed from Bookmarks",
        "success"
      );
    },
    onError: () => {
      showToast("Failed to update bookmarks", "error");
    },
  });

  // Progress mutation
  const progressMutation = useMutation({
    mutationFn: async ({ paperId, completed }: { paperId: string; completed: boolean }) => {
      console.log("[progressMutation] Starting", { paperId, completed, hasSession: !!session });
      if (!session) {
        console.error("[progressMutation] No session available");
        throw new Error("No session available");
      }
      const sessionToken = session.access_token;
      console.log("[progressMutation] Session token:", sessionToken ? "present" : "missing");
      if (!sessionToken) {
        console.error("[progressMutation] No access token in session");
        throw new Error("No access token in session");
      }
      console.log("[progressMutation] Calling markPaperCompleted");
      await markPaperCompleted({ data: { paperId, sessionToken, completed } });
    },
    onSuccess: (_, variables) => {
      console.log("[progressMutation] onSuccess", variables);
      queryClient.invalidateQueries({ queryKey: ["paper-progress"] });
      queryClient.invalidateQueries({ queryKey: ["paper-statistics"] });
      showToast(
        variables.completed ? "Marked as Completed" : "Completion Removed",
        "success"
      );
    },
    onError: (error) => {
      console.error("[progressMutation] onError", error);
      showToast("Failed to update completion status", "error");
    },
  });

  // Download tracking mutation
  const downloadMutation = useMutation({
    mutationFn: async (paperId: string) => {
      if (!session?.access_token) return;
      await trackPaperDownload({ data: { paperId, sessionToken: session.access_token } });
    },
  });

  // Fetch all papers for filter options (unfiltered)
  const { data: allPapers } = useQuery({
    queryKey: ["public-papers-all"],
    queryFn: async () => await listPublicPapers({ data: {} }),
  });

  // Fetch filtered papers for display
  const { data: papers, isLoading } = useQuery({
    queryKey: ["public-papers", selectedPaperType, selectedSubject, selectedChapter, selectedYear, search],
    queryFn: async () => await listPublicPapers({
      data: {
        paper_type: selectedPaperType || undefined,
        subject: selectedSubject || undefined,
        chapter: selectedChapter || undefined,
        year: selectedYear || undefined,
        search: search || undefined,
      },
    }),
  });

  useEffect(() => {
    if (allPapers) {
      const years = Array.from(new Set(allPapers.map((p: any) => p.year).filter(Boolean)));
      const paperTypes = Array.from(new Set(allPapers.map((p: any) => p.paper_type).filter(Boolean)));
      const subjects = Array.from(new Set(allPapers.map((p: any) => p.subject).filter(Boolean)));
      const chapters = Array.from(new Set(allPapers.map((p: any) => p.chapter).filter(Boolean)));
      setUniqueYears(years as string[]);
      setUniquePaperTypes(paperTypes as string[]);
      setUniqueSubjects(subjects as string[]);
      setUniqueChapters(chapters as string[]);
    }
  }, [allPapers]);

  const paperList = useMemo(() => {
    if (!papers || papers.length === 0) return [];
    return papers;
  }, [papers]);

  const displayPapers = isLoading ? Array.from({ length: 6 }) : paperList;

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
          {!isLoading && displayPapers.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search || selectedPaperType || selectedSubject || selectedChapter || selectedYear
                  ? "No papers match your filters"
                  : "No papers available"}
              </p>
            </div>
          )}
          {displayPapers.map((paper, index) => {
            const isPlaceholder = isLoading;
            const item = paper as typeof paperList[number];
            const isCompleted = !isPlaceholder && item ? completedPaperIds.has(item.id) : false;
            
            return (
              <Card key={isPlaceholder ? `placeholder-${index}` : item.id} className="hover-lift flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-sm truncate">
                        {isPlaceholder ? "Loading…" : item.title}
                      </div>
                      {!isPlaceholder && session && (
                        <button
                          onClick={() => {
                            const isBookmarked = bookmarkedPaperIds.has(item.id);
                            bookmarkMutation.mutate(
                              { itemId: item.id, action: isBookmarked ? "remove" : "add" }
                            );
                          }}
                          disabled={bookmarkMutation.isPending}
                          className={cn(
                            "shrink-0 transition",
                            bookmarkedPaperIds.has(item.id) ? "text-primary fill-primary" : "text-muted-foreground hover:text-primary",
                            bookmarkMutation.isPending && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Bookmark className={cn("size-4", bookmarkedPaperIds.has(item.id) && "fill-current")} />
                        </button>
                      )}
                    </div>
                    {!isPlaceholder && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <Pill tone="info">{item.paper_type}</Pill>
                        <Pill>{item.subject}</Pill>
                        {item.chapter && <Pill tone="warning">{item.chapter}</Pill>}
                        <Pill>{item.year}</Pill>
                        {isCompleted && <Pill tone="success"><Check className="size-3" /> Completed</Pill>}
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
                    href={isPlaceholder || !item ? undefined : item.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => !isPlaceholder && item && downloadMutation.mutate(item.id)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition hover:bg-surface-2",
                      isPlaceholder ? "cursor-not-allowed text-muted-foreground" : "text-foreground",
                    )}
                  >
                    <Download className="size-3.5" />
                  </a>
                  {!isPlaceholder && session && (
                    <Button
                      size="sm"
                      variant={isCompleted ? "primary" : "outline"}
                      disabled={progressMutation.isPending}
                      onClick={() => progressMutation.mutate({ paperId: item.id, completed: !isCompleted })}
                    >
                      {isCompleted ? <Check className="size-3.5" /> : <Play className="size-3.5" />}
                      {isCompleted ? "Completed" : "Mark Complete"}
                    </Button>
                  )}
                  {!isPlaceholder && !session && (
                    <Button size="sm" variant="primary" disabled={isPlaceholder || !item || !item.attempt_as_test}>
                      <Play className="size-3.5" /> Attempt
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </AppShell>
  );
}
