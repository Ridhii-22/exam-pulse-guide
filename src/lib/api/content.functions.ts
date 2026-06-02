import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listPublicTests = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      search: z.string().optional(),
      kind: z.string().optional(),
      subject: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    let query = supabaseAdmin.from("tests").select("*").order("created_at", { ascending: false });

    if (data.search) {
      query = query.or(`title.ilike.%${data.search}%,kind.ilike.%${data.search}%`);
    }
    if (data.kind) {
      query = query.eq("kind", data.kind);
    }
    if (data.subject) {
      query = query.eq("subject", data.subject);
    }

    const { data: response, error } = await query.limit(200);
    if (error) {
      throw new Error(error.message);
    }

    return response ?? [];
  });

export const listPublicPapers = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      search: z.string().optional(),
      paper_type: z.string().optional(),
      subject: z.string().optional(),
      chapter: z.string().optional(),
      year: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    let query = supabaseAdmin.from("papers").select("*").order("created_at", { ascending: false });

    if (data.search) {
      query = query.or(`title.ilike.%${data.search}%,paper_type.ilike.%${data.search}%,subject.ilike.%${data.search}%,chapter.ilike.%${data.search}%`);
    }
    if (data.paper_type) {
      query = query.eq("paper_type", data.paper_type);
    }
    if (data.subject) {
      query = query.eq("subject", data.subject);
    }
    if (data.chapter) {
      query = query.eq("chapter", data.chapter);
    }
    if (data.year) {
      query = query.eq("year", data.year);
    }

    const { data: response, error } = await query.limit(200);
    if (error) {
      throw new Error(error.message);
    }

    return response ?? [];
  });

export const listPublicLectures = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      search: z.string().optional(),
      subject: z.string().optional(),
      chapter: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    let query = supabaseAdmin.from("lectures").select("*").order("created_at", { ascending: false });

    if (data.search) {
      query = query.or(`title.ilike.%${data.search}%,subject.ilike.%${data.search}%,chapter.ilike.%${data.search}%`);
    }
    if (data.subject) {
      query = query.eq("subject", data.subject);
    }
    if (data.chapter) {
      query = query.eq("chapter", data.chapter);
    }

    const { data: response, error } = await query.limit(200);
    if (error) {
      throw new Error(error.message);
    }

    return response ?? [];
  });
