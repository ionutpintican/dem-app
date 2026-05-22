-- ============================================================
-- dem-app – Schema inițială
-- Rulează în Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. EXTENSII
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- 1. TIPURI ENUM
-- ────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('user', 'specialist', 'coordinator', 'admin');

CREATE TYPE case_status AS ENUM (
  'draft',
  'open',
  'in_review',
  'pending_specialist',
  'resolved',
  'closed',
  'rejected'
);

CREATE TYPE case_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE file_category AS ENUM (
  'document',
  'image',
  'contract',
  'report',
  'evidence',
  'other'
);

CREATE TYPE audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'view',
  'status_change',
  'file_upload',
  'file_delete',
  'assign',
  'login',
  'logout'
);

CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed', 'bounced');

-- ────────────────────────────────────────────────────────────
-- 2. TABELA users (extinde auth.users)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT        NOT NULL UNIQUE,
  full_name         TEXT,
  phone             TEXT,
  avatar_url        TEXT,
  role              user_role   NOT NULL DEFAULT 'user',
  is_coordinator    BOOLEAN     NOT NULL DEFAULT FALSE,
  -- is_coordinator = TRUE înseamnă că poate coordona cazuri chiar dacă rolul e specialist
  department        TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.users.is_coordinator IS
  'TRUE dacă utilizatorul poate coordona cazuri, independent de rol';

-- ────────────────────────────────────────────────────────────
-- 3. TABELA cases
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.cases (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number       TEXT          NOT NULL UNIQUE,
  -- număr generat automat: DEM-2026-0001
  title             TEXT          NOT NULL,
  description       TEXT,
  status            case_status   NOT NULL DEFAULT 'draft',
  priority          case_priority NOT NULL DEFAULT 'medium',
  category          TEXT,

  -- Relații utilizatori
  created_by        UUID          NOT NULL REFERENCES public.users(id),
  assigned_to       UUID          REFERENCES public.users(id),    -- specialist responsabil
  coordinator_id    UUID          REFERENCES public.users(id),    -- coordonator caz

  -- Metadate
  due_date          DATE,
  resolved_at       TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,
  tags              TEXT[]        DEFAULT '{}',
  metadata          JSONB         DEFAULT '{}',

  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Funcție + trigger pentru generarea automată a numărului de caz
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num   INT;
  new_num   TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1
    INTO seq_num
    FROM public.cases
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  new_num := 'DEM-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  NEW.case_number := new_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_case_number
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL OR NEW.case_number = '')
  EXECUTE FUNCTION generate_case_number();

-- ────────────────────────────────────────────────────────────
-- 4. TABELA case_files
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.case_files (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID          NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  uploaded_by     UUID          NOT NULL REFERENCES public.users(id),

  file_name       TEXT          NOT NULL,
  file_path       TEXT          NOT NULL,   -- cale în Supabase Storage
  file_size       BIGINT,                   -- bytes
  mime_type       TEXT,
  category        file_category NOT NULL DEFAULT 'document',
  description     TEXT,
  is_public       BOOLEAN       NOT NULL DEFAULT FALSE,
  -- is_public = FALSE → vizibil doar utilizatorilor cu acces la caz

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 5. TABELA specialist_inputs
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.specialist_inputs (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID          NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  specialist_id   UUID          NOT NULL REFERENCES public.users(id),

  content         TEXT          NOT NULL,
  recommendation  TEXT,                     -- recomandare formală
  is_final        BOOLEAN       NOT NULL DEFAULT FALSE,
  -- is_final = TRUE → opinia este definitivă și nu mai poate fi editată

  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT specialist_inputs_final_once
    UNIQUE NULLS NOT DISTINCT (case_id, specialist_id, is_final)
    -- un singur input final per specialist per caz
);

-- ────────────────────────────────────────────────────────────
-- 6. TABELA audit_logs
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          REFERENCES public.users(id) ON DELETE SET NULL,
  action          audit_action  NOT NULL,
  table_name      TEXT          NOT NULL,
  record_id       UUID,                     -- ID-ul înregistrării afectate
  case_id         UUID          REFERENCES public.cases(id) ON DELETE SET NULL,

  old_data        JSONB,                    -- starea înainte
  new_data        JSONB,                    -- starea după
  ip_address      INET,
  user_agent      TEXT,
  notes           TEXT,

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Audit_logs nu se șterg niciodată – partiționare opțională pentru volume mari
COMMENT ON TABLE public.audit_logs IS
  'Jurnal imutabil de acțiuni. Rândurile nu se șterg niciodată manual.';

-- ────────────────────────────────────────────────────────────
-- 7. TABELA email_log
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.email_log (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID          REFERENCES public.cases(id) ON DELETE SET NULL,
  user_id         UUID          REFERENCES public.users(id) ON DELETE SET NULL,

  recipient_email TEXT          NOT NULL,
  subject         TEXT          NOT NULL,
  template        TEXT,                     -- numele template-ului folosit
  status          email_status  NOT NULL DEFAULT 'pending',
  resend_id       TEXT,                     -- ID-ul returnat de Resend API
  error_message   TEXT,

  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 8. INDECȘI
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_cases_created_by    ON public.cases(created_by);
CREATE INDEX idx_cases_assigned_to   ON public.cases(assigned_to);
CREATE INDEX idx_cases_coordinator   ON public.cases(coordinator_id);
CREATE INDEX idx_cases_status        ON public.cases(status);
CREATE INDEX idx_cases_created_at    ON public.cases(created_at DESC);

CREATE INDEX idx_case_files_case_id  ON public.case_files(case_id);
CREATE INDEX idx_specialist_case_id  ON public.specialist_inputs(case_id);
CREATE INDEX idx_specialist_user_id  ON public.specialist_inputs(specialist_id);

CREATE INDEX idx_audit_user_id       ON public.audit_logs(user_id);
CREATE INDEX idx_audit_case_id       ON public.audit_logs(case_id);
CREATE INDEX idx_audit_created_at    ON public.audit_logs(created_at DESC);

CREATE INDEX idx_email_log_case_id   ON public.email_log(case_id);
CREATE INDEX idx_email_log_status    ON public.email_log(status);

-- ────────────────────────────────────────────────────────────
-- 9. TRIGGER updated_at automat
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_specialist_updated_at
  BEFORE UPDATE ON public.specialist_inputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- 10. TRIGGER auto-creare profil la înregistrare
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 11. ROW LEVEL SECURITY – activare
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_files        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log         ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 12. FUNCȚII HELPER pentru RLS (evită N+1 în politici)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_is_coordinator()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_coordinator, FALSE)
  FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 13. RLS POLITICI – users
-- ────────────────────────────────────────────────────────────

-- Oricine autentificat își poate vedea propriul profil
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (id = auth.uid());

-- Adminii văd toți utilizatorii
CREATE POLICY "users_select_admin"
  ON public.users FOR SELECT
  USING (auth_is_admin());

-- Coordonatorii văd toți utilizatorii (necesitar pentru asignare)
CREATE POLICY "users_select_coordinator"
  ON public.users FOR SELECT
  USING (auth_is_coordinator());

-- Utilizatorul își poate actualiza propriul profil (fără rol)
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- prevenim auto-escaladare de rol: rolul nu poate fi schimbat de utilizator
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND is_coordinator = (SELECT is_coordinator FROM public.users WHERE id = auth.uid())
  );

-- Doar adminii pot schimba roluri sau crea/șterge utilizatori
CREATE POLICY "users_all_admin"
  ON public.users FOR ALL
  USING (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- ────────────────────────────────────────────────────────────
-- 14. RLS POLITICI – cases
-- ────────────────────────────────────────────────────────────

-- Adminii și coordonatorii văd toate cazurile
CREATE POLICY "cases_select_admin_coord"
  ON public.cases FOR SELECT
  USING (auth_is_admin() OR auth_is_coordinator());

-- Creatorul vede propriile cazuri
CREATE POLICY "cases_select_own"
  ON public.cases FOR SELECT
  USING (created_by = auth.uid());

-- Specialistul vede cazurile asignate lui
CREATE POLICY "cases_select_assigned"
  ON public.cases FOR SELECT
  USING (assigned_to = auth.uid());

-- Coordonatorul de caz vede cazurile pe care le coordonează
CREATE POLICY "cases_select_as_coordinator"
  ON public.cases FOR SELECT
  USING (coordinator_id = auth.uid());

-- Orice utilizator autentificat poate crea un caz
CREATE POLICY "cases_insert_authenticated"
  ON public.cases FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Creatorul poate edita cazul cât timp e în draft
CREATE POLICY "cases_update_creator_draft"
  ON public.cases FOR UPDATE
  USING (
    created_by = auth.uid()
    AND status = 'draft'
  );

-- Coordonatorii și adminii pot edita orice caz
CREATE POLICY "cases_update_admin_coord"
  ON public.cases FOR UPDATE
  USING (auth_is_admin() OR auth_is_coordinator());

-- Specialistul poate actualiza statusul cazurilor asignate lui
CREATE POLICY "cases_update_specialist"
  ON public.cases FOR UPDATE
  USING (
    assigned_to = auth.uid()
    AND auth_user_role() IN ('specialist', 'coordinator')
  );

-- Doar adminii pot șterge cazuri
CREATE POLICY "cases_delete_admin"
  ON public.cases FOR DELETE
  USING (auth_is_admin());

-- ────────────────────────────────────────────────────────────
-- 15. RLS POLITICI – case_files
-- ────────────────────────────────────────────────────────────

-- Vizibilitate: oricine cu acces la caz vede fișierele publice
CREATE POLICY "case_files_select_public"
  ON public.case_files FOR SELECT
  USING (
    is_public = TRUE
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id
        AND (
          c.created_by = auth.uid()
          OR c.assigned_to = auth.uid()
          OR c.coordinator_id = auth.uid()
          OR auth_is_admin()
          OR auth_is_coordinator()
        )
    )
  );

-- Fișierele private – doar cei cu acces direct la caz
CREATE POLICY "case_files_select_private"
  ON public.case_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id
        AND (
          c.created_by = auth.uid()
          OR c.assigned_to = auth.uid()
          OR c.coordinator_id = auth.uid()
          OR auth_is_admin()
        )
    )
  );

-- Încărcare fișiere: utilizatorii cu acces la caz
CREATE POLICY "case_files_insert"
  ON public.case_files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id
        AND (
          c.created_by = auth.uid()
          OR c.assigned_to = auth.uid()
          OR c.coordinator_id = auth.uid()
          OR auth_is_admin()
          OR auth_is_coordinator()
        )
    )
  );

-- Ștergere fișiere: cel care a încărcat sau admin
CREATE POLICY "case_files_delete"
  ON public.case_files FOR DELETE
  USING (uploaded_by = auth.uid() OR auth_is_admin());

-- ────────────────────────────────────────────────────────────
-- 16. RLS POLITICI – specialist_inputs
-- ────────────────────────────────────────────────────────────

-- Specialistul vede propriile contribuții
CREATE POLICY "specialist_inputs_select_own"
  ON public.specialist_inputs FOR SELECT
  USING (specialist_id = auth.uid());

-- Coordonatorii și adminii văd toate contribuțiile
CREATE POLICY "specialist_inputs_select_privileged"
  ON public.specialist_inputs FOR SELECT
  USING (auth_is_admin() OR auth_is_coordinator());

-- Creatorul cazului vede contribuțiile finale
CREATE POLICY "specialist_inputs_select_case_owner"
  ON public.specialist_inputs FOR SELECT
  USING (
    is_final = TRUE
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id AND c.created_by = auth.uid()
    )
  );

-- Specialistul poate adăuga contribuții la cazurile asignate lui
CREATE POLICY "specialist_inputs_insert"
  ON public.specialist_inputs FOR INSERT
  WITH CHECK (
    specialist_id = auth.uid()
    AND auth_user_role() IN ('specialist', 'coordinator', 'admin')
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id
        AND (c.assigned_to = auth.uid() OR auth_is_admin() OR auth_is_coordinator())
    )
  );

-- Specialistul poate edita propriile contribuții necefinalizate
CREATE POLICY "specialist_inputs_update_own"
  ON public.specialist_inputs FOR UPDATE
  USING (
    specialist_id = auth.uid()
    AND is_final = FALSE
  );

-- Adminii pot edita orice
CREATE POLICY "specialist_inputs_update_admin"
  ON public.specialist_inputs FOR UPDATE
  USING (auth_is_admin());

-- ────────────────────────────────────────────────────────────
-- 17. RLS POLITICI – audit_logs
-- ────────────────────────────────────────────────────────────

-- Nimeni nu poate insera direct – doar prin funcții SECURITY DEFINER
-- INSERT este blocat prin absența politicii WITH CHECK pentru non-service
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  USING (auth_is_admin());

-- Coordonatorii văd doar audit-ul cazurilor lor
CREATE POLICY "audit_logs_select_coordinator"
  ON public.audit_logs FOR SELECT
  USING (
    auth_is_coordinator()
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.cases c
        WHERE c.id = case_id AND c.coordinator_id = auth.uid()
      )
    )
  );

-- Utilizatorul vede propriile acțiuni
CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Inserarea se face exclusiv din service role / SECURITY DEFINER
CREATE POLICY "audit_logs_insert_service"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth_is_admin());

-- Nicio politică de UPDATE sau DELETE → audit_logs sunt imutabile

-- ────────────────────────────────────────────────────────────
-- 18. RLS POLITICI – email_log
-- ────────────────────────────────────────────────────────────

-- Adminii văd toate email-urile trimise
CREATE POLICY "email_log_select_admin"
  ON public.email_log FOR SELECT
  USING (auth_is_admin());

-- Utilizatorul vede email-urile care i-au fost trimise
CREATE POLICY "email_log_select_own"
  ON public.email_log FOR SELECT
  USING (user_id = auth.uid());

-- Inserarea doar din service role
CREATE POLICY "email_log_insert_service"
  ON public.email_log FOR INSERT
  WITH CHECK (auth_is_admin());

-- ────────────────────────────────────────────────────────────
-- 19. FUNCȚIE HELPER – înregistrare audit din aplicație
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_audit(
  p_action      audit_action,
  p_table_name  TEXT,
  p_record_id   UUID DEFAULT NULL,
  p_case_id     UUID DEFAULT NULL,
  p_old_data    JSONB DEFAULT NULL,
  p_new_data    JSONB DEFAULT NULL,
  p_notes       TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, case_id,
    old_data, new_data, notes
  )
  VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_case_id,
    p_old_data, p_new_data, p_notes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 20. DATE INIȚIALE – cont admin (opțional)
-- ────────────────────────────────────────────────────────────
-- Decomentează și înlocuiește UUID-ul după ce creezi primul cont în Supabase Auth:
--
-- UPDATE public.users
-- SET role = 'admin', is_coordinator = TRUE
-- WHERE email = 'admin@domeniu.ro';

-- ────────────────────────────────────────────────────────────
-- VERIFICARE FINALĂ
-- ────────────────────────────────────────────────────────────
-- Rulează după migrare pentru a confirma că totul e corect:
--
-- SELECT schemaname, tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
--
-- SELECT tablename, policyname, cmd, qual
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
