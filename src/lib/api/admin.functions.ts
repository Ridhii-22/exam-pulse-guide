import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const getSupabaseAdmin = async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
};

export const ensureAdmin = async () => {
  const supabaseAdmin = await getSupabaseAdmin();
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseAdmin.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new Error("Unauthorized");
  }

  const userId = data.claims.sub;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("Forbidden");
  }

  return userId;
};

export const adminGetDashboard = createServerFn({ method: "GET" }).handler(
  async () => {
    await ensureAdmin();

    const supabaseAdmin = await getSupabaseAdmin();
    const [questions, tests, papers, lectures, subjects, chapters, syllabusVersions, students] = await Promise.all([
      supabaseAdmin.from("questions").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("tests").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("papers").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("lectures").select("id", { count: "exact", head: true }),
      (supabaseAdmin.from("subjects" as any).select("id", { count: "exact", head: true })),
      (supabaseAdmin.from("chapters" as any).select("id", { count: "exact", head: true })),
      (supabaseAdmin.from("syllabus_versions" as any).select("id", { count: "exact", head: true })),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin"),
    ]);

    return {
      questions: questions.count ?? 0,
      tests: tests.count ?? 0,
      papers: papers.count ?? 0,
      lectures: lectures.count ?? 0,
      subjects: subjects.count ?? 0,
      chapters: chapters.count ?? 0,
      syllabusVersions: syllabusVersions.count ?? 0,
      students: students.count ?? 0,
    };
  },
);

const questionInput = z.object({
  id: z.string().uuid().optional(),
  subject: z.string().min(1),
  chapter: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.string().min(1),
  question_text: z.string().min(1),
  options: z.array(z.string()).min(2),
  correct_answer: z.string().min(1),
  explanation: z.string().optional(),
  year: z.string().optional(),
  question_type: z.string().min(1),
});

export const adminListQuestions = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      search: z.string().optional(),
      subject: z.string().optional(),
      chapter: z.string().optional(),
      difficulty: z.string().optional(),
      question_type: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();

    let query = supabaseAdmin.from("questions").select("*").order("created_at", { ascending: false });

    if (data.search) {
      query = query.or(
        `question_text.ilike.%${data.search}%,subject.ilike.%${data.search}%,chapter.ilike.%${data.search}%,topic.ilike.%${data.search}%`,
      );
    }
    if (data.subject) {
      query = query.eq("subject", data.subject);
    }
    if (data.chapter) {
      query = query.eq("chapter", data.chapter);
    }
    if (data.difficulty) {
      query = query.eq("difficulty", data.difficulty);
    }
    if (data.question_type) {
      query = query.eq("question_type", data.question_type);
    }

    const { data: response, error } = await query.limit(100);
    if (error) {
      throw new Error(error.message);
    }
    return response ?? [];
  });

export const adminUpsertQuestion = createServerFn({ method: "POST" })
  .inputValidator(z.object({ item: questionInput }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();

    const payload = {
      subject: data.item.subject,
      chapter: data.item.chapter,
      topic: data.item.topic,
      difficulty: data.item.difficulty,
      question_text: data.item.question_text,
      options: data.item.options,
      correct_answer: data.item.correct_answer,
      explanation: data.item.explanation ?? "",
      year: data.item.year ?? "",
      question_type: data.item.question_type,
      updated_at: new Date().toISOString(),
    };

    if (data.item.id) {
      const { error } = await supabaseAdmin.from("questions").update(payload).eq("id", data.item.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }

    const { error } = await supabaseAdmin.from("questions").insert({ ...payload, created_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminBulkUploadQuestions = createServerFn({ method: "POST" })
  .inputValidator(z.object({ items: z.array(questionInput) }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();

    const payload = data.items.map((item) => ({
      id: item.id,
      subject: item.subject,
      chapter: item.chapter,
      topic: item.topic,
      difficulty: item.difficulty,
      question_text: item.question_text,
      options: item.options,
      correct_answer: item.correct_answer,
      explanation: item.explanation ?? "",
      year: item.year ?? "",
      question_type: item.question_type,
      updated_at: new Date().toISOString(),
      created_at: item.id ? undefined : new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("questions")
      .upsert(payload, { onConflict: "id" as any });

    if (error) {
      throw new Error(error.message);
    }
    return { success: true, imported: payload.length };
  });

export const adminDeleteQuestion = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

const testInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  kind: z.string().min(1),
  subject: z.string().optional(),
  timer_seconds: z.number().min(0),
  total_marks: z.number().min(0),
  section_config: z.record(z.any()).optional(),
  question_ids: z.array(z.string().uuid()).optional(),
});

export const adminListTests = createServerFn({ method: "GET" })
  .inputValidator(z.object({ search: z.string().optional() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    let query = supabaseAdmin.from("tests").select("*").order("created_at", { ascending: false });
    if (data.search) {
      query = query.ilike("title", `%${data.search}%`);
    }
    const { data: response, error } = await query.limit(100);
    if (error) throw new Error(error.message);
    return response ?? [];
  });

export const adminUpsertTest = createServerFn({ method: "POST" })
  .inputValidator(z.object({ item: testInput }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();

    const payload = {
      title: data.item.title,
      kind: data.item.kind,
      subject: data.item.subject ?? "",
      timer_seconds: data.item.timer_seconds,
      total_marks: data.item.total_marks,
      section_config: data.item.section_config ?? {},
      question_ids: data.item.question_ids ?? [],
      updated_at: new Date().toISOString(),
    };

    if (data.item.id) {
      const { error } = await supabaseAdmin.from("tests").update(payload).eq("id", data.item.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }

    const { error } = await supabaseAdmin.from("tests").insert({ ...payload, created_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminDeleteTest = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();

    // Get paper details to extract storage path
    const { data: paper, error: fetchError } = await supabaseAdmin
      .from("papers")
      .select("pdf_url")
      .eq("id", data.id)
      .maybeSingle();

    if (fetchError || !paper) throw new Error("Paper not found");

    // Delete from storage if pdf_url exists
    if (paper.pdf_url && paper.pdf_url.includes("storage/v1")) {
      try {
        const urlParts = new URL(paper.pdf_url);
        const pathParts = urlParts.pathname.split("/");
        const bucketIndex = pathParts.indexOf("object");
        if (bucketIndex !== -1 && bucketIndex + 2 < pathParts.length) {
          // URL format can be either /storage/v1/object/public/<bucket>/<path>
          // or /storage/v1/object/<bucket>/<path>
          let bucket: string | undefined;
          let filePath: string | undefined;
          if (pathParts[bucketIndex + 1] === "public") {
            bucket = pathParts[bucketIndex + 2];
            filePath = pathParts.slice(bucketIndex + 3).join("/");
          } else {
            bucket = pathParts[bucketIndex + 1];
            filePath = pathParts.slice(bucketIndex + 2).join("/");
          }
          if (bucket && filePath) {
            await supabaseAdmin.storage.from(bucket).remove([filePath]);
          }
        }
      } catch (e) {
        console.warn("Failed to delete storage file:", e);
      }
    }

    // Delete database record
    const { error: deleteError } = await supabaseAdmin.from("papers").delete().eq("id", data.id);
    if (deleteError) throw new Error(deleteError.message);
    return { success: true };
  });

export const adminUploadPaperPDF = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      filename: z.string().min(1),
      file: z.instanceof(File),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();

    // Check if bucket exists, create if it doesn't
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    if (bucketsError) {
      console.error("Failed to list buckets:", bucketsError);
      throw new Error(`Failed to check storage buckets: ${bucketsError.message}`);
    }

    const bucketExists = buckets?.some((bucket) => bucket.id === "papers");
    if (!bucketExists) {
      console.log("Creating 'papers' storage bucket...");
      const { error: createError } = await supabaseAdmin.storage.createBucket("papers", {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ["application/pdf"],
      });
      if (createError) {
        console.error("Failed to create bucket:", createError);
        throw new Error(`Failed to create storage bucket: ${createError.message}`);
      }
      console.log("Successfully created 'papers' storage bucket");
    }

    const timestamp = Date.now();
    const sanitizedFilename = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `papers/${timestamp}_${sanitizedFilename}`;

    const arrayBuffer = await data.file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log(`Uploading file to path: ${storagePath}`);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("papers")
      .upload(storagePath, uint8Array, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error details:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log(`File uploaded successfully to: ${uploadData.path}`);

    // Generate public URL
    const { data: publicUrl } = supabaseAdmin.storage.from("papers").getPublicUrl(uploadData.path);

    return { url: publicUrl.publicUrl, path: uploadData.path };
  });

const paperInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  paper_type: z.enum(["Full NEET PYQ", "Subject Wise", "Chapter Wise", "Mock Test"]).optional(),
  subject: z.enum(["Physics", "Chemistry", "Biology"]).optional(),
  chapter: z.string().optional(),
  year: z.string().optional(),
  description: z.string().optional(),
  pdf_url: z.string().min(1),
  attempt_as_test: z.boolean().optional(),
});

export const adminListPapers = createServerFn({ method: "GET" })
  .inputValidator(z.object({ search: z.string().optional() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    let query = supabaseAdmin.from("papers").select("*").order("created_at", { ascending: false });
    if (data.search) {
      query = query.ilike("title", `%${data.search}%`);
    }
    const { data: response, error } = await query.limit(100);
    if (error) throw new Error(error.message);
    return response ?? [];
  });

export const adminUpsertPaper = createServerFn({ method: "POST" })
  .inputValidator(z.object({ item: paperInput }))
  .handler(async ({ data }) => {
    const userId = await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    const payload: any = {
      title: data.item.title,
      paper_type: data.item.paper_type ?? "Full NEET PYQ",
      subject: data.item.subject ?? "",
      chapter: data.item.chapter ?? "",
      year: data.item.year ?? "",
      description: data.item.description ?? "",
      pdf_url: data.item.pdf_url,
      attempt_as_test: data.item.attempt_as_test ?? false,
      uploaded_by: userId,
      updated_at: new Date().toISOString(),
    };
    if (data.item.id) {
      const { error } = await supabaseAdmin.from("papers").update(payload).eq("id", data.item.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }
    const createdAt = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("papers")
      .insert({ ...payload, created_at: createdAt, uploaded_at: createdAt });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminDeletePaper = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();

    // Get paper details to extract storage path
    const { data: paper, error: fetchError } = await supabaseAdmin
      .from("papers")
      .select("pdf_url")
      .eq("id", data.id)
      .maybeSingle();

    if (fetchError || !paper) throw new Error("Paper not found");

    // Delete from storage if pdf_url exists
    if (paper.pdf_url && paper.pdf_url.includes("storage/v1")) {
      try {
        const urlParts = new URL(paper.pdf_url);
        const pathParts = urlParts.pathname.split("/");
        const bucketIndex = pathParts.indexOf("object");
        if (bucketIndex !== -1 && bucketIndex + 2 < pathParts.length) {
          let bucket: string | undefined;
          let filePath: string | undefined;
          if (pathParts[bucketIndex + 1] === "public") {
            bucket = pathParts[bucketIndex + 2];
            filePath = pathParts.slice(bucketIndex + 3).join("/");
          } else {
            bucket = pathParts[bucketIndex + 1];
            filePath = pathParts.slice(bucketIndex + 2).join("/");
          }
          if (bucket && filePath) {
            await supabaseAdmin.storage.from(bucket).remove([filePath]);
          }
        }
      } catch (e) {
        console.warn("Failed to delete storage file:", e);
      }
    }

    // Delete database record
    const { error: deleteError } = await supabaseAdmin.from("papers").delete().eq("id", data.id);
    if (deleteError) throw new Error(deleteError.message);
    return { success: true };
  });

const lectureInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  subject: z.string().optional(),
  chapter: z.string().optional(),
  resource_url: z.string().min(1),
  playlist_id: z.string().optional(),
  description: z.string().optional(),
  duration_seconds: z.number().min(0).optional(),
  is_featured: z.boolean().optional(),
});

export const adminListLectures = createServerFn({ method: "GET" })
  .inputValidator(z.object({ search: z.string().optional() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    let query = supabaseAdmin.from("lectures").select("*").order("created_at", { ascending: false });
    if (data.search) {
      query = query.ilike("title", `%${data.search}%`);
    }
    const { data: response, error } = await query.limit(100);
    if (error) throw new Error(error.message);
    return response ?? [];
  });

export const adminUpsertLecture = createServerFn({ method: "POST" })
  .inputValidator(z.object({ item: lectureInput }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    const payload = {
      title: data.item.title,
      subject: data.item.subject ?? "",
      chapter: data.item.chapter ?? "",
      resource_url: data.item.resource_url,
      playlist_id: data.item.playlist_id ?? "",
      description: data.item.description ?? "",
      duration_seconds: data.item.duration_seconds ?? 0,
      is_featured: data.item.is_featured ?? false,
      updated_at: new Date().toISOString(),
    };
    if (data.item.id) {
      const { error } = await supabaseAdmin.from("lectures").update(payload).eq("id", data.item.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }
    const { error } = await supabaseAdmin.from("lectures").insert({ ...payload, created_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminDeleteLecture = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("lectures").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
