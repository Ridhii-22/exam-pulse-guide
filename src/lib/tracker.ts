import { supabase } from "@/integrations/supabase/client";

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function touchActivity(patch: Partial<{ questions_solved: number; lectures_watched: number; tests_taken: number; study_seconds: number }>) {
  const user_id = await uid();
  if (!user_id) return;
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", user_id)
    .eq("activity_date", today)
    .maybeSingle();
  const next = {
    user_id,
    activity_date: today,
    questions_solved: (existing?.questions_solved ?? 0) + (patch.questions_solved ?? 0),
    lectures_watched: (existing?.lectures_watched ?? 0) + (patch.lectures_watched ?? 0),
    tests_taken: (existing?.tests_taken ?? 0) + (patch.tests_taken ?? 0),
    study_seconds: (existing?.study_seconds ?? 0) + (patch.study_seconds ?? 0),
  };
  await supabase.from("daily_activity").upsert(next, { onConflict: "user_id,activity_date" });
}

export async function recordLectureProgress(args: {
  lecture_id: string;
  subject?: string;
  chapter?: string;
  progress_percent: number;
  last_position_seconds?: number;
}) {
  const user_id = await uid();
  if (!user_id) return;
  const completed = args.progress_percent >= 95;
  await supabase.from("lecture_progress").upsert(
    {
      user_id,
      lecture_id: args.lecture_id,
      subject: args.subject,
      chapter: args.chapter,
      progress_percent: Math.min(100, Math.max(0, Math.round(args.progress_percent))),
      last_position_seconds: args.last_position_seconds ?? 0,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lecture_id" },
  );
  if (completed) await touchActivity({ lectures_watched: 1 });
}

export type QuestionResult = { subject: string; chapter: string; is_correct: boolean; skipped?: boolean };

export async function recordTestAttempt(args: {
  test_id?: string;
  title: string;
  kind?: string;
  subject?: string;
  score: number;
  total: number;
  time_taken_seconds?: number;
  questions?: QuestionResult[];
}) {
  const user_id = await uid();
  if (!user_id) return null;
  const accuracy = args.total > 0 ? (args.score / args.total) * 100 : 0;
  const { data: attempt, error } = await supabase
    .from("test_attempts")
    .insert({
      user_id,
      test_id: args.test_id,
      title: args.title,
      kind: args.kind ?? "mock",
      subject: args.subject,
      score: args.score,
      total: args.total,
      accuracy: Number(accuracy.toFixed(2)),
      time_taken_seconds: args.time_taken_seconds ?? 0,
    })
    .select("id")
    .single();
  if (error || !attempt) return null;

  if (args.questions?.length) {
    await supabase.from("question_attempts").insert(
      args.questions.map((q) => ({
        user_id,
        subject: q.subject,
        chapter: q.chapter,
        is_correct: q.is_correct,
        skipped: q.skipped ?? false,
        test_attempt_id: attempt.id,
      })),
    );
  }
  await touchActivity({ tests_taken: 1, questions_solved: args.total });
  return attempt.id;
}

export function computeStreak(dates: string[]): number {
  // dates: YYYY-MM-DD strings of days with activity
  const set = new Set(dates);
  let streak = 0;
  const cur = new Date();
  // allow today missing — start from yesterday if today empty
  if (!set.has(cur.toISOString().slice(0, 10))) cur.setDate(cur.getDate() - 1);
  while (set.has(cur.toISOString().slice(0, 10))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}
