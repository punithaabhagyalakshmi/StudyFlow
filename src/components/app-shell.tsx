import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Brain, ListChecks, Calendar, StickyNote, Layers, HelpCircle,
  Bot, Timer, Target, BarChart3, User, Settings, LogOut, GraduationCap, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { toast } from "sonner";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "AI Planner", icon: Brain },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/quiz", label: "Quiz", icon: HelpCircle },
  { to: "/tutor", label: "AI Tutor", icon: Bot },
  { to: "/pomodoro", label: "Pomodoro", icon: Timer },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

const secondary = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

const bottomNav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/calendar", label: "Cal", icon: Calendar },
  { to: "/tutor", label: "Tutor", icon: Bot },
  { to: "/profile", label: "You", icon: User },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-mesh min-h-screen">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar/60 backdrop-blur-xl md:flex">
          <SidebarBody />
        </aside>
        <div className="min-w-0 flex-1">
          <MobileHeader open={open} setOpen={setOpen} />
          <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-4 sm:px-6 md:pb-8 md:pt-8">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function MobileHeader({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl md:hidden">
      <Link to="/dashboard" className="flex min-w-0 items-center gap-2 font-semibold">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-gradient shadow-glow">
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="truncate text-sm">StudyFlow</span>
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2 border-b border-border/60 px-5 py-4 font-semibold">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient shadow-glow">
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span>StudyFlow<span className="text-brand-gradient"> AI</span></span>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map((i) => <NavLink key={i.to} to={i.to} label={i.label} Icon={i.icon} active={location.pathname === i.to} onNavigate={onNavigate} />)}
        <div className="mt-4 border-t border-border/60 pt-3">
          {secondary.map((i) => <NavLink key={i.to} to={i.to} label={i.label} Icon={i.icon} active={location.pathname === i.to} onNavigate={onNavigate} />)}
        </div>
      </nav>
      <div className="border-t border-border/60 p-3">
        <Button onClick={signOut} variant="ghost" className="w-full justify-start text-muted-foreground">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

function NavLink({ to, label, Icon, active, onNavigate }: { to: string; label: string; Icon: React.ComponentType<{ className?: string }>; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      to={to as string}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {bottomNav.map((i) => {
          const active = location.pathname === i.to;
          return (
            <li key={i.to}>
              <Link to={i.to as string} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${active ? "text-brand-2" : "text-muted-foreground"}`}>
                <i.icon className="h-5 w-5" /> {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}