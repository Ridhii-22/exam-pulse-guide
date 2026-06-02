import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui-bits";
import { Sparkles } from "lucide-react";
import { Field } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — NeetForge" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [year, setYear] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/", replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await signUp(email, password, fullName, year);
    setBusy(false);
    if (error) setErr(error);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-sm card-soft p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">NeetForge</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">Premium NEET prep</div>
          </div>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Track every chapter, test, and streak in one place.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Full name"
            value={fullName}
            onChange={setFullName}
            required
            autoComplete="name"
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
            autoComplete="new-password"
          />
          <Field
            label="Target exam year (optional)"
            type="number"
            value={year}
            onChange={setYear}
          />
          {err && <div className="text-xs text-destructive">{err}</div>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
