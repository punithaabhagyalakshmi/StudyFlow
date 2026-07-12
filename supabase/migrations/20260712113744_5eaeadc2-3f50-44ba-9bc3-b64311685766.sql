
-- Enums
CREATE TYPE public.task_priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE public.task_status AS ENUM ('pending','in_progress','completed');
CREATE TYPE public.event_type AS ENUM ('class','exam','study','assignment','holiday','other');
CREATE TYPE public.goal_period AS ENUM ('daily','weekly','monthly','semester');
CREATE TYPE public.plan_period AS ENUM ('daily','weekly','monthly','revision');
CREATE TYPE public.difficulty AS ENUM ('easy','medium','hard');

-- Timestamps helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  college TEXT,
  department TEXT,
  year INTEGER,
  semester INTEGER,
  target_gpa NUMERIC(3,2),
  preferred_study_time TEXT,
  wake_time TIME,
  sleep_time TIME,
  daily_study_hours NUMERIC(4,2),
  goals TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid()=id) WITH CHECK (auth.uid()=id);
CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- user_stats
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  total_study_minutes INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stats" ON public.user_stats FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- attach trigger for signup (only if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- subjects
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  color TEXT DEFAULT '#6366F1',
  difficulty public.difficulty DEFAULT 'medium',
  credits INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.subjects (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subjects" ON public.subjects FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects ON DELETE SET NULL,
  parent_task_id UUID REFERENCES public.tasks ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,
  recurrence TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.tasks (user_id, due_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks" ON public.tasks FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER t_tasks_upd BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- calendar_events
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type public.event_type NOT NULL DEFAULT 'other',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.calendar_events (user_id, starts_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events" ON public.calendar_events FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- study_plans
CREATE TABLE public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  period public.plan_period NOT NULL,
  title TEXT,
  plan JSONB NOT NULL,
  starts_on DATE,
  ends_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.study_plans (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plans TO authenticated;
GRANT ALL ON public.study_plans TO service_role;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plans" ON public.study_plans FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- notes
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  folder TEXT,
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.notes (user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes" ON public.notes FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER t_notes_upd BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- flashcards
CREATE TABLE public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_decks TO authenticated;
GRANT ALL ON public.flashcard_decks TO service_role;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own decks" ON public.flashcard_decks FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  deck_id UUID REFERENCES public.flashcard_decks ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  known BOOLEAN DEFAULT false,
  review_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.flashcards (deck_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cards" ON public.flashcards FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects ON DELETE SET NULL,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  score INTEGER,
  total INTEGER,
  difficulty public.difficulty DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quizzes" ON public.quizzes FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- pomodoro
CREATE TABLE public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'focus',
  completed BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);
CREATE INDEX ON public.pomodoro_sessions (user_id, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pomodoro_sessions TO authenticated;
GRANT ALL ON public.pomodoro_sessions TO service_role;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own poms" ON public.pomodoro_sessions FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  period public.goal_period NOT NULL,
  target NUMERIC,
  progress NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.goals FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- achievements
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  badge TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xp_awarded INTEGER DEFAULT 0,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ach" ON public.achievements FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  kind TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notif" ON public.notifications FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- ai_tutor_chats
CREATE TABLE public.ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chats TO authenticated;
GRANT ALL ON public.ai_chats TO service_role;
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chats" ON public.ai_chats FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER t_ai_chats_upd BEFORE UPDATE ON public.ai_chats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.ai_chats ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.ai_messages (chat_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own msg" ON public.ai_messages FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
