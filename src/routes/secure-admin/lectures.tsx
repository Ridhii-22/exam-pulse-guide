import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { Button, Card } from "@/components/ui-bits";
import {
  adminDeleteLecture,
  adminListLectures,
  adminUpsertLecture,
} from "@/lib/api/admin.functions";

export const Route = createFileRoute("/secure-admin/lectures")({
  head: () => ({ meta: [{ title: "Manage Lectures — NeetForge" }] }),
  component: AdminLectures,
});

const defaultLecture = {
  title: "",
  subject: "",
  chapter: "",
  resource_url: "",
  playlist_id: "",
  description: "",
  duration_seconds: 0,
  is_featured: false,
};

function AdminLectures() {
  const [search, setSearch] = useState("");
  const [activeLecture, setActiveLecture] = useState<any>(null);
  const [formData, setFormData] = useState(defaultLecture);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lectures", search],
    queryFn: async () => await adminListLectures({ data: { search } }),
  });

  const saveMutation = useMutation({
    mutationFn: async (item: any) => await adminUpsertLecture({ data: { item } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lectures"] });
      setActiveLecture(null);
      setFormData(defaultLecture);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await adminDeleteLecture({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-lectures"] }),
  });

  const beginEdit = (item: any) => {
    setActiveLecture(item);
    setFormData({
      title: item.title,
      subject: item.subject ?? "",
      chapter: item.chapter ?? "",
      resource_url: item.resource_url,
      playlist_id: item.playlist_id ?? "",
      description: item.description ?? "",
      duration_seconds: item.duration_seconds,
      is_featured: item.is_featured,
    });
  };

  return (
    <AdminShell
      title="Lecture management"
      description="Manage lecture links and playlist references for syllabus chapters."
      active="/secure-admin/lectures"
    >
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Lecture catalog</h2>
              <p className="text-sm text-muted-foreground">Keep playlists organized by subject and chapter.</p>
            </div>
          </div>

          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lectures by title"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-surface text-sm uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Chapter</th>
                  <th className="px-3 py-2">Featured</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((item: any) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-3 text-sm">{item.title}</td>
                    <td className="px-3 py-3 text-sm">{item.subject || "General"}</td>
                    <td className="px-3 py-3 text-sm">{item.chapter || "—"}</td>
                    <td className="px-3 py-3 text-sm">{item.is_featured ? "Yes" : "No"}</td>
                    <td className="px-3 py-3 flex gap-2 flex-wrap">
                      <Button variant="ghost" size="sm" onClick={() => beginEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(item.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {(data ?? []).length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No lectures found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{activeLecture ? "Edit lecture" : "Add lecture"}</h2>
              <p className="text-sm text-muted-foreground">Publish lecture resources and playlist links for students.</p>
            </div>
            <Field label="Title" value={formData.title} onChange={(value) => setFormData((prev) => ({ ...prev, title: value }))} />
            <Field label="Subject" value={formData.subject} onChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))} />
            <Field label="Chapter" value={formData.chapter} onChange={(value) => setFormData((prev) => ({ ...prev, chapter: value }))} />
            <Field label="Resource URL" value={formData.resource_url} onChange={(value) => setFormData((prev) => ({ ...prev, resource_url: value }))} />
            <Field label="Playlist ID" value={formData.playlist_id} onChange={(value) => setFormData((prev) => ({ ...prev, playlist_id: value }))} />
            <label className="block text-sm text-foreground">
              <span className="text-xs text-muted-foreground">Description</span>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Duration" value={String(formData.duration_seconds)} onChange={(value) => setFormData((prev) => ({ ...prev, duration_seconds: Number(value) }))} />
              <label className="flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_featured: e.target.checked }))}
                  className="h-4 w-4 rounded border-input text-primary focus-visible:ring-ring"
                />
                Featured lecture
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => saveMutation.mutate({ ...activeLecture, ...formData })} disabled={saveMutation.status === "pending"}>
                {activeLecture ? "Save lecture" : "Add lecture"}
              </Button>
              <Button variant="secondary" onClick={() => { setActiveLecture(null); setFormData(defaultLecture); }}>
                Reset
              </Button>
            </div>
            {saveMutation.error && <p className="text-sm text-destructive">Unable to save lecture.</p>}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm text-foreground">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </label>
  );
}
