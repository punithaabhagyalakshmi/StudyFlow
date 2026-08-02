import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset your password — StudyFlow AI" },
      { name: "description", content: "Securely set a new StudyFlow AI password using the recovery link sent to your email." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Reset your password — StudyFlow AI" },
      { property: "og:description", content: "Securely set a new StudyFlow AI password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

type Status = "verifying" | "ready" | "invalid";

function scorePassword(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

function ResetPage() {
  const nav = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // Consume the recovery link (PKCE ?code=, ?token_hash=, or #access_token=)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const errDesc = url.searchParams.get("error_description") ?? hash.get("error_description");

      const clean = () => window.history.replaceState({}, "", url.pathname);
      const fail = (m: string) => {
        if (cancelled) return;
        setErrorMsg(m);
        setStatus("invalid");
        clean();
      };
      const ok = () => {
        if (cancelled) return;
        setStatus("ready");
        clean();
      };

      if (errDesc) return fail(errDesc);

      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash") ?? hash.get("token_hash");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) return fail(error.message);
          return ok();
        }
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
          if (error) return fail(error.message);
          return ok();
        }
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) return fail(error.message);
          return ok();
        }
        // No link params — only allow if a recovery/authenticated session already exists.
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          return fail("This password reset link is invalid or has expired. Request a new one to continue.");
        }
        return ok();
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Could not verify the reset link.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    if (scorePassword(pw) < 3) {
      toast.error("Choose a stronger password (8+ chars with upper, lower, and a number or symbol).");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Invalidate every other session opened with the old password.
    await supabase.auth.signOut({ scope: "others" }).catch(() => {});
    toast.success("Password updated. You're signed in.");
    nav({ to: "/dashboard" });
  }

  const strength = scorePassword(pw);
  const strengthLabel = ["Too weak", "Weak", "Okay", "Strong", "Excellent"][strength];

  return (
    <div className="bg-mesh flex min-h-screen items-center justify-center px-4 py-8">
      <div className="glass w-full max-w-md rounded-3xl p-8 shadow-soft">
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-destructive/10">
              <TriangleAlert className="h-5 w-5 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold">Link expired or invalid</h1>
            <p className="text-sm text-muted-foreground">
              {errorMsg ?? "This password reset link can't be used."} Reset links work once and expire after a short
              time — request a fresh one.
            </p>
            <Button asChild className="w-full bg-brand-gradient text-primary-foreground">
              <Link to="/auth" search={{ mode: "signin" }}>Request a new link</Link>
            </Button>
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Verified recovery link
            </div>
            <h1 className="text-xl font-semibold">Set a new password</h1>
            <div className="space-y-1.5">
              <Label htmlFor="pw">New password</Label>
              <Input
                id="pw"
                type="password"
                autoComplete="new-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                minLength={8}
                required
              />
              {pw.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i < strength ? "bg-primary" : "bg-border"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strengthLabel}</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gradient text-primary-foreground shadow-glow"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              For your safety, other devices will be signed out.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
