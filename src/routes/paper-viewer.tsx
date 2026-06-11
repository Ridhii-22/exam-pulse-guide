import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, Container, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui-bits";
import { Download, ArrowLeft, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { trackPaperView } from "@/lib/api/student.functions";

export const Route = createFileRoute("/paper-viewer")({
  validateSearch: (search: Record<string, unknown>) => ({
    paperId: typeof search.paperId === "string" ? search.paperId : undefined,
    title: typeof search.title === "string" ? search.title : "Paper",
    pdfUrl: typeof search.pdfUrl === "string" ? search.pdfUrl : undefined,
  }),
  component: PaperViewerPage,
});

function PaperViewerPage() {
  const search = Route.useSearch();
  const { paperId, title, pdfUrl } = search;
  const navigate = useNavigate();
  const { session } = useAuth();
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session && paperId && pdfUrl) {
      // Track paper view when the page loads
      trackPaperView({ data: { paperId, sessionToken: session.access_token } });
    }
  }, [session, paperId, pdfUrl]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  const handleDownload = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const handleBack = () => {
    navigate({ to: "/papers" });
  };

  if (!pdfUrl) {
    return (
      <AppShell>
        <Container>
          <div className="py-12 text-center">
            <p className="text-muted-foreground">PDF URL not found</p>
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft className="size-4 mr-2" /> Back to Papers
            </Button>
          </div>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Container>
        <PageHeader
          title={title}
          action={
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="size-4 mr-2" /> Back to Papers
            </Button>
          }
        />

        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 bg-surface-1 rounded-lg">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleZoomOut} disabled={zoom <= 50}>
                <ZoomOut className="size-4" />
              </Button>
              <span className="text-sm font-medium w-16 text-center">{zoom}%</span>
              <Button size="sm" variant="outline" onClick={handleZoomIn} disabled={zoom >= 200}>
                <ZoomIn className="size-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetZoom}>
                <Maximize2 className="size-4" />
              </Button>
            </div>
            <Button onClick={handleDownload}>
              <Download className="size-4 mr-2" /> Download PDF
            </Button>
          </div>

          {/* PDF Viewer */}
          <div className="relative w-full bg-surface-1 rounded-lg overflow-hidden" style={{ height: "calc(100vh - 300px)", minHeight: "600px" }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading PDF...</p>
                </div>
              </div>
            )}
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              title={title}
            />
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
