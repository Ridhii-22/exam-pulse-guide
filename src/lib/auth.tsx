import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "student" | "admin";

const TEMP_ADMIN_EMAIL = "ridhiijain6@gmail.com";
const TEMP_ADMIN_PASSWORD = "Ridhii@22";

type ProfileData = {
  id: string;
  full_name: string | null;
  target_year: number | null;
  xp: number;
  level: number;
  role: Role;
  created_at: string;
  updated_at: string;
};

function isAdminSession(session: Session | null) {
  return session?.user?.email?.toLowerCase() === TEMP_ADMIN_EMAIL.toLowerCase();
}

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: Role;
  profile: ProfileData | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    targetYear?: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

// Rely on Supabase as the single source of truth for auth session.

async function fetchProfile(userId: string): Promise<ProfileData | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, target_year, xp, level, role, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();
  return data as ProfileData | null;
}

async function ensureAdminProfile(userId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError || !existing) {
    return;
  }

  if (existing.role !== "admin") {
    const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", userId);
    if (error) {
      console.warn("Temporary admin profile update failed:", error.message);
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);

      if (import.meta.env.DEV) {
        // Development-only behavior: force a fresh sign-in on every app launch.
        await supabase.auth.signOut();
      }

      const { data } = await supabase.auth.getSession();
      const currentSession = data.session ?? null;
      setSession(currentSession);
      if (currentSession && currentSession.user) {
        const profileData = await fetchProfile(currentSession.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    loadSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => {
      // when auth state changes, keep loading true while resolving profile
      setLoading(true);
      const sessionObj = s ?? null;
      setSession(sessionObj);
      if (sessionObj && sessionObj.user) {
        fetchProfile(sessionObj.user.id)
          .then((profileData) => setProfile(profileData))
          .finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const isTemporaryAdmin = isAdminSession(session);
  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    loading,
    profile,
    role: isTemporaryAdmin || profile?.role === "admin" ? "admin" : "student",
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.session && email === TEMP_ADMIN_EMAIL && password === TEMP_ADMIN_PASSWORD) {
        await ensureAdminProfile(data.session.user.id);
      }
      return { error: error?.message ?? null };
    },
    signUp: async (email, password, fullName, targetYear) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName, target_year: targetYear ?? "" },
        },
      });
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
