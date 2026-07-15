-- Supabase Realtime: publish attendance + users changes to websocket subscribers.
-- Setup: Supabase Dashboard → Project Settings → API → JWT Secret
--          must match JWT_ACCESS_SECRET in backend/.env
--          Add SUPABASE_ANON_KEY (anon public key) to backend/.env

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
END $$;

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_realtime_select_own ON public.attendance;
DROP POLICY IF EXISTS attendance_realtime_select_staff ON public.attendance;
DROP POLICY IF EXISTS users_realtime_select_staff ON public.users;
DROP POLICY IF EXISTS users_realtime_select_own ON public.users;

CREATE POLICY attendance_realtime_select_own ON public.attendance
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY attendance_realtime_select_staff ON public.attendance
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'hr'));

CREATE POLICY users_realtime_select_staff ON public.users
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'hr'));

CREATE POLICY users_realtime_select_own ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
