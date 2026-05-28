import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { computeStreak } from "@/lib/tracker";

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
}

export function useDashboardData() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      const uid = user!.id;
      const [profile, tests, activity, lectures, questions] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase
          .from("test_attempts")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("daily_activity")
          .select("activity_date, questions_solved, lectures_watched, tests_taken, study_seconds")
          .eq("user_id", uid)
          .order("activity_date", { ascending: false })
          .limit(140),
        supabase.from("lecture_progress").select("*").eq("user_id", uid),
        supabase.from("question_attempts").select("subject,chapter,is_correct").eq("user_id", uid),
      ]);

      const dates = (activity.data ?? []).map((a) => a.activity_date as string);
      const streak = computeStreak(dates);

      // subject accuracy
      const bySubject: Record<string, { c: number; t: number }> = {};
      for (const q of questions.data ?? []) {
        const s = q.subject;
        bySubject[s] = bySubject[s] || { c: 0, t: 0 };
        bySubject[s].t++;
        if (q.is_correct) bySubject[s].c++;
      }
      const subjectAccuracy = Object.entries(bySubject).map(([subject, v]) => ({
        subject,
        accuracy: v.t ? Math.round((v.c / v.t) * 100) : 0,
        solved: v.t,
      }));

      // weak chapters: low accuracy with at least 3 attempts
      const byChap: Record<string, { subject: string; c: number; t: number }> = {};
      for (const q of questions.data ?? []) {
        const k = `${q.subject}::${q.chapter}`;
        byChap[k] = byChap[k] || { subject: q.subject, c: 0, t: 0 };
        byChap[k].t++;
        if (q.is_correct) byChap[k].c++;
      }
      const weakChapters = Object.entries(byChap)
        .filter(([, v]) => v.t >= 3)
        .map(([k, v]) => ({
          name: k.split("::")[1],
          subject: v.subject,
          accuracy: Math.round((v.c / v.t) * 100),
        }))
        .filter((x) => x.accuracy < 60)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5);

      const totalQuestions = questions.data?.length ?? 0;
      const totalCorrect = (questions.data ?? []).filter((q) => q.is_correct).length;
      const avgAccuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      const studySeconds = (activity.data ?? []).reduce((a, b) => a + (b.study_seconds ?? 0), 0);

      return {
        profile: profile.data,
        tests: tests.data ?? [],
        activity: activity.data ?? [],
        lectures: lectures.data ?? [],
        streak,
        subjectAccuracy,
        weakChapters,
        totalQuestions,
        avgAccuracy,
        studyHours: Math.round(studySeconds / 360) / 10,
      };
    },
  });
}

export function useLectureProgressMap() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["lecture-progress", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("lecture_progress").select("*").eq("user_id", user!.id);
      const map: Record<string, { progress_percent: number; completed: boolean; last_position_seconds: number }> = {};
      for (const r of data ?? []) {
        map[r.lecture_id] = {
          progress_percent: r.progress_percent,
          completed: r.completed,
          last_position_seconds: r.last_position_seconds,
        };
      }
      return map;
    },
  });
}
