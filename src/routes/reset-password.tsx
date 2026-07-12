import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — StudyFlow AI" }] }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated."); nav({ to: "/dashboard" }); }
  }
  return (
    <div className="bg-mesh flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="glass w-full max-w-md space-y-4 rounded-3xl p-8 shadow-soft">
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-brand-gradient text-primary-foreground">Update password</Button>
      </form>
    </div>
  );
}