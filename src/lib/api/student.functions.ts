import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// Bookmark functions
export const addBookmark = createServerFn({ method: "POST" })
  .inputValidator(z.object({ itemId: z.string(), itemType: z.string().default("paper"), sessionToken: z.string() }))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.sessionToken);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { error } = await supabase
      .from("bookmarks")
      .insert({ user_id: user.id, item_id: data.itemId, item_type: data.itemType });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { success: true };
  });

export const removeBookmark = createServerFn({ method: "POST" })
  .inputValidator(z.object({ itemId: z.string(), itemType: z.string().default("paper"), sessionToken: z.string() }))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.sessionToken);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", data.itemId)
      .eq("item_type", data.itemType);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { success: true };
  });

export const listBookmarks = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sessionToken: z.string(), itemType: z.string().default("paper") }))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.sessionToken);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: bookmarks, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .eq("item_type", data.itemType)
      .order("created_at", { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return bookmarks ?? [];
  });

// Progress functions
export const markPaperCompleted = createServerFn({ method: "POST" })
  .inputValidator(z.object({ paperId: z.string(), sessionToken: z.string(), completed: z.boolean() }))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    console.log("[markPaperCompleted] Starting with data:", { paperId: data.paperId, completed: data.completed });

    const { data: { user }, error: authError } = await supabase.auth.getUser(data.sessionToken);
    if (authError || !user) {
      console.error("[markPaperCompleted] Auth error:", authError);
      throw new Error("Unauthorized");
    }

    console.log("USER_ID", user.id);
    console.log("PAPER_ID", data.paperId);

    if (data.completed) {
      console.log("[markPaperCompleted] Inserting completion record");
      const payload = {
        user_id: user.id,
        paper_id: data.paperId,
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log("QUERY_PAYLOAD", payload);

      // Try insert first, if it fails due to unique constraint, update instead
      const { error: insertError, data: insertResponse } = await supabase
        .from("paper_progress")
        .insert(payload)
        .select();

      console.log("SUPABASE_INSERT_RESPONSE", insertResponse);
      console.log("SUPABASE_INSERT_ERROR", insertError);

      if (insertError) {
        console.log("[markPaperCompleted] Insert failed, trying update");
        const { error: updateError, data: updateResponse } = await supabase
          .from("paper_progress")
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("paper_id", data.paperId)
          .select();

        console.log("SUPABASE_UPDATE_RESPONSE", updateResponse);
        console.log("SUPABASE_UPDATE_ERROR", updateError);

        if (updateError) {
          console.error("[markPaperCompleted] Update error:", updateError);
          console.error("[markPaperCompleted] Error details:", JSON.stringify(updateError, null, 2));
          throw new Error(`Database error: ${updateError.message} (code: ${updateError.code})`);
        }
        console.log("[markPaperCompleted] Update successful:", updateResponse);
      } else {
        console.log("[markPaperCompleted] Insert successful:", insertResponse);
      }
    } else {
      console.log("[markPaperCompleted] Updating completion to false");
      const payload = {
        completed: false,
        completed_at: null,
        updated_at: new Date().toISOString(),
      };
      console.log("QUERY_PAYLOAD", payload);

      const { error, data: response } = await supabase
        .from("paper_progress")
        .update(payload)
        .eq("user_id", user.id)
        .eq("paper_id", data.paperId);

      console.log("SUPABASE_RESPONSE", response);
      console.log("SUPABASE_ERROR", error);

      if (error) {
        console.error("[markPaperCompleted] Update error:", error);
        console.error("[markPaperCompleted] Error details:", JSON.stringify(error, null, 2));
        throw new Error(`Database error: ${error.message} (code: ${error.code})`);
      }
      console.log("[markPaperCompleted] Update successful:", response);
    }

    return { success: true };
  });

export const getPaperProgress = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sessionToken: z.string() }))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.sessionToken);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: progress, error } = await supabase
      .from("paper_progress")
      .select("*")
      .eq("user_id", user.id);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return progress ?? [];
  });

export const getPaperStatistics = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sessionToken: z.string() }))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.sessionToken);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get total papers count
    const { count: totalPapers, error: countError } = await supabase
      .from("papers")
      .select("*", { count: "exact", head: true });
    
    if (countError) {
      throw new Error(countError.message);
    }

    // Get completed papers count
    const { count: completedPapers, error: progressError } = await supabase
      .from("paper_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", true);
    
    if (progressError) {
      throw new Error(progressError.message);
    }

    const remaining = (totalPapers || 0) - (completedPapers || 0);
    const percentage = totalPapers ? Math.round(((completedPapers || 0) / totalPapers) * 100) : 0;

    return {
      total: totalPapers || 0,
      completed: completedPapers || 0,
      remaining,
      percentage,
    };
  });

// Recent activity functions
export const trackPaperView = createServerFn({ method: "POST" })
  .inputValidator(z.object({ paperId: z.string(), sessionToken: z.string() }))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.sessionToken);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { error } = await supabase
      .from("recent_activity")
      .insert({
        user_id: user.id,
        activity_type: "view",
        item_id: data.paperId,
        item_type: "paper",
      });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { success: true };
  });

export const trackPaperDownload = createServerFn({ method: "POST" })
  .inputValidator(z.object({ paperId: z.string(), sessionToken: z.string() }))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.sessionToken);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { error } = await supabase
      .from("recent_activity")
      .insert({
        user_id: user.id,
        activity_type: "download",
        item_id: data.paperId,
        item_type: "paper",
      });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { success: true };
  });

export const listRecentActivity = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sessionToken: z.string(), limit: z.number().default(10) }))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.sessionToken);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: activity, error } = await supabase
      .from("recent_activity")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return activity ?? [];
  });

export const getBookmarkedPapers = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sessionToken: z.string() }))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.sessionToken);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: bookmarks, error } = await supabase
      .from("bookmarks")
      .select("*, papers(*)")
      .eq("user_id", user.id)
      .eq("item_type", "paper")
      .order("created_at", { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return bookmarks?.map((b: any) => b.papers).filter(Boolean) ?? [];
  });
