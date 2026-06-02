import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ensureAdmin } from "./admin.functions";
import type { SubjectRow, ChapterRow, SyllabusVersionRow, QuestionUploadItem, BulkUploadResponse } from "@/lib/cms/types";

const cleanSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function getOrCreateSubject(name: string) {
  const normalized = name.trim();
  if (!normalized) throw new Error("Subject name is required.");

  const { data: existing, error: selectError } = await supabaseAdmin
    .from("subjects")
    .select("*")
    .eq("name", normalized)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);
  if (existing) return existing as SubjectRow;

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("subjects")
    .insert({ name: normalized, updated_at: new Date().toISOString() })
    .select("*")
    .maybeSingle();

  if (insertError) throw new Error(insertError.message);
  return inserted as SubjectRow;
}

async function getOrCreateChapter(subjectId: string, name: string) {
  const normalized = name.trim();
  if (!normalized) throw new Error("Chapter name is required.");

  const slug = cleanSlug(normalized);
  const { data: existing, error: selectError } = await supabaseAdmin
    .from("chapters")
    .select("*")
    .eq("subject_id", subjectId)
    .eq("name", normalized)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);
  if (existing) return existing as ChapterRow;

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("chapters")
    .insert({ subject_id: subjectId, name: normalized, slug, updated_at: new Date().toISOString() })
    .select("*")
    .maybeSingle();

  if (insertError) throw new Error(insertError.message);
  return inserted as ChapterRow;
}

export const adminListSubjects = createServerFn({ method: "GET" })
  .handler(async () => {
    await ensureAdmin();
    const { data, error } = await supabaseAdmin.from("subjects").select("*").order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as SubjectRow[];
  });

export const adminUpsertSubject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (data.id) {
      const { error } = await supabaseAdmin.from("subjects").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }

    const { error } = await supabaseAdmin.from("subjects").insert({ ...payload, created_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminListChapters = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      subject_id: z.string().uuid().optional(),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    let query = supabaseAdmin.from("chapters").select("*").order("name", { ascending: true });
    if (data.subject_id) query = query.eq("subject_id", data.subject_id);
    if (data.search) query = query.ilike("name", `%${data.search}%`);
    const { data: response, error } = await query;
    if (error) throw new Error(error.message);
    return (response ?? []) as ChapterRow[];
  });

export const adminUpsertChapter = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid().optional(),
      subject_id: z.string().uuid(),
      name: z.string().min(1),
      description: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const payload = {
      subject_id: data.subject_id,
      name: data.name.trim(),
      slug: cleanSlug(data.name),
      description: data.description?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("chapters").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }
    const { error } = await supabaseAdmin.from("chapters").insert({ ...payload, created_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminListSyllabusVersions = createServerFn({ method: "GET" })
  .handler(async () => {
    await ensureAdmin();
    const { data, error } = await supabaseAdmin
      .from("syllabus_versions")
      .select("*")
      .order("effective_year", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as SyllabusVersionRow[];
  });

export const adminUpsertSyllabusVersion = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1),
      effective_year: z.number().int().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const payload = {
      name: data.name.trim(),
      effective_year: data.effective_year ?? null,
      notes: data.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("syllabus_versions").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }
    const { error } = await supabaseAdmin
      .from("syllabus_versions")
      .insert({ ...payload, created_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminBulkUploadQuestions = createServerFn({ method: "POST" })
  .inputValidator(z.object({ items: z.array(z.object({
    question_text: z.string().min(1),
    subject: z.string().min(1),
    chapter: z.string().min(1),
    topic: z.string().optional(),
    difficulty: z.string().min(1),
    options: z.array(z.string()).min(2),
    correct_answer: z.string().min(1),
    explanation: z.string().optional(),
    year: z.string().optional(),
    question_type: z.string().min(1),
  })) }))
  .handler(async ({ data }) => {
    await ensureAdmin();

    const errors: BulkUploadResponse["errors"] = [];
    let imported = 0;
    let skipped = 0;

    for (const [index, item] of data.items.entries()) {
      const rowIndex = index + 1;
      try {
        const subject = await getOrCreateSubject(item.subject);
        const chapter = await getOrCreateChapter(subject.id, item.chapter);

        const { data: existing, error: existingError } = await supabaseAdmin
          .from("questions")
          .select("id")
          .eq("question_text", item.question_text)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing) {
          skipped += 1;
          errors.push({ row: rowIndex, message: "Duplicate question text skipped." });
          continue;
        }

        const questionPayload = {
          subject_id: subject.id,
          chapter_id: chapter.id,
          subject: subject.name,
          chapter: chapter.name,
          topic: item.topic?.trim() || chapter.name,
          difficulty: item.difficulty,
          question_text: item.question_text,
          options: item.options,
          correct_answer: item.correct_answer,
          explanation: item.explanation ?? null,
          year: item.year ?? null,
          question_type: item.question_type,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertError } = await supabaseAdmin
          .from("questions")
          .insert(questionPayload)
          .select("id")
          .maybeSingle();

        if (insertError || !inserted) {
          throw insertError ?? new Error("Unable to insert question.");
        }

        const optionsPayload = item.options.map((optionText, position) => ({
          question_id: inserted.id,
          option_text: optionText,
          is_correct: optionText.trim() === item.correct_answer.trim(),
          position,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: optionError } = await supabaseAdmin.from("question_options").insert(optionsPayload);
        if (optionError) throw optionError;

        imported += 1;
      } catch (error) {
        errors.push({ row: rowIndex, message: (error as Error).message });
      }
    }

    return { imported, skipped, errors } as BulkUploadResponse;
  });

export const adminBulkUploadPapers = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      items: z.array(
        z.object({
          title: z.string().min(1),
          year: z.string().optional(),
          category: z.string().optional(),
          pdf_url: z.string().min(1),
          attempt_as_test: z.boolean().optional(),
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    const errors: BulkUploadResponse["errors"] = [];
    let imported = 0;
    let skipped = 0;

    for (const [index, item] of data.items.entries()) {
      const rowIndex = index + 1;
      try {
        const { data: existing, error: existingError } = await supabaseAdmin
          .from("papers")
          .select("id")
          .eq("title", item.title)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing) {
          skipped += 1;
          errors.push({ row: rowIndex, message: "Duplicate paper title skipped." });
          continue;
        }

        const payload = {
          title: item.title,
          year: item.year ?? null,
          category: item.category ?? null,
          pdf_url: item.pdf_url,
          attempt_as_test: item.attempt_as_test ?? false,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin.from("papers").insert(payload);
        if (error) throw error;
        imported += 1;
      } catch (error) {
        errors.push({ row: rowIndex, message: (error as Error).message });
      }
    }

    return { imported, skipped, errors } as BulkUploadResponse;
  });
