import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, Loader2, MailCheck } from "lucide-react";
import { OtpFields, useCooldown } from "@/components/otp-fields";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Sign in — StudyFlow AI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const cooldown = useCooldown(60);

  // After an OAuth redirect the provider drops us back here with a session.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) navigate({ to: "/dashboard" });
    });
    return () => { cancelled = true; };
  }, [navigate]);

  async function handleGoogle() {
    setLoading(true);
    try {
      const host = window.location.hostname;
      // The Lovable-managed OAuth broker only works on lovable.app / connected
      // custom domains. Anywhere else (e.g. a Vercel deployment or localhost)
      // we go straight through Supabase's own Google callback.
      const useBroker = host.endsWith("lovable.app") || host.endsWith("lovable.dev");

      if (!useBroker) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin + "/auth",
            queryParams: { prompt: "select_account" },
          },
        });
        if (error) throw error;
        return; // browser redirects to Google
      }

      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
      if (result.error) throw result.error;
      if (!result.redirected) {
        await router.invalidate();
        navigate({ to: "/dashboard" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await router.invalidate();
        navigate({ to: "/dashboard" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  async function handleReset() {
    navigate({ to: "/reset-password", search: { email: email || undefined } });
  }

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!otpEmail) { toast.error("Enter your email first."); return; }
    if (cooldown.active) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + "/auth" },
      });
      if (error) throw error;
      setOtpSent(true);
      setOtp("");
      cooldown.start();
      toast.success("We sent a 6-digit code to your email.");
    } catch (err) {
      const m = err instanceof Error ? err.message : "Could not send the code";
      toast.error(/rate|too many/i.test(m) ? "Too many requests. Please wait a minute and try again." : m);
    } finally { setLoading(false); }
  }

  async function verifyOtp(code = otp) {
    if (code.length !== 6) { toast.error("Enter the full 6-digit code."); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email: otpEmail, token: code, type: "email" });
      if (error) throw error;
      if (!data.session) throw new Error("Could not start your session. Request a new code.");
      await router.invalidate();
      navigate({ to: "/dashboard" });
    } catch (err) {
      const m = err instanceof Error ? err.message : "Verification failed";
      toast.error(/expired|invalid/i.test(m) ? "That code is invalid or expired. Request a new one." : m);
      setOtp("");
    } finally { setLoading(false); }
  }

  return (
    <div className="bg-mesh flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient shadow-glow">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>StudyFlow<span className="text-brand-gradient"> AI</span></span>
        </Link>
        <div className="glass rounded-3xl p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to keep your streak going.</p>
          <Button onClick={handleGoogle} disabled={loading} variant="outline" className="mt-6 h-11 w-full">
            <GoogleIcon /> Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
              <TabsTrigger value="otp">Email code</TabsTrigger>
            </TabsList>
            <TabsContent value="otp" className="mt-4 space-y-3">
              {!otpSent ? (
                <form onSubmit={sendOtp} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="otp-email">Email</Label>
                    <Input id="otp-email" type="email" autoComplete="email" value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)} required />
                  </div>
                  <p className="text-xs text-muted-foreground">We'll email you a 6-digit code — no password needed.</p>
                  <Button type="submit" disabled={loading || cooldown.active}
                    className="h-11 w-full bg-brand-gradient text-primary-foreground shadow-glow">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : cooldown.active ? `Wait ${cooldown.left}s` : "Send code"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MailCheck className="h-4 w-4 text-primary" /> Code sent to {otpEmail}
                  </div>
                  <OtpFields value={otp} onChange={setOtp} onComplete={verifyOtp} disabled={loading} />
                  <Button onClick={() => verifyOtp()} disabled={loading || otp.length !== 6}
                    className="h-11 w-full bg-brand-gradient text-primary-foreground shadow-glow">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
                  </Button>
                  <div className="flex items-center justify-between text-xs">
                    <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }}
                      className="text-muted-foreground underline underline-offset-4 hover:text-foreground">Change email</button>
                    <button type="button" onClick={() => sendOtp()} disabled={cooldown.active || loading}
                      className="text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:no-underline disabled:opacity-60">
                      {cooldown.active ? `Resend in ${cooldown.left}s` : "Resend code"}
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>
            <form onSubmit={handleEmail} className="mt-4 space-y-3 data-[hidden=true]:hidden" data-hidden={tab === "otp"}>
              <TabsContent value="signup" className="mt-0 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </TabsContent>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              {tab === "signin" && (
                <button type="button" onClick={handleReset} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Forgot password?</button>
              )}
              <Button type="submit" disabled={loading} className="h-11 w-full bg-brand-gradient text-primary-foreground shadow-glow">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : tab === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>
          </Tabs>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">By continuing you agree to our terms & privacy policy.</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.4 1.68 14.94.6 12 .6 7.32.6 3.36 3.24 1.5 7.14l3.66 2.82C6.06 7.14 8.76 5.04 12 5.04z"/><path fill="#4285F4" d="M23.4 12.24c0-.84-.06-1.62-.18-2.4H12v4.56h6.42c-.3 1.56-1.14 2.88-2.4 3.78l3.6 2.76c2.1-1.98 3.78-4.86 3.78-8.7z"/><path fill="#FBBC05" d="M5.16 14.28c-.24-.72-.36-1.5-.36-2.28s.12-1.56.36-2.28L1.5 6.9C.72 8.46.24 10.2.24 12s.48 3.54 1.26 5.1l3.66-2.82z"/><path fill="#34A853" d="M12 23.4c3 0 5.52-.96 7.38-2.64l-3.6-2.76c-.96.66-2.28 1.08-3.78 1.08-3.24 0-6-2.16-6.96-5.1L1.5 16.86C3.36 20.76 7.32 23.4 12 23.4z"/></svg>
  );
}