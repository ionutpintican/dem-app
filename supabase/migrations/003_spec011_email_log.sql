-- ============================================================
-- Spec 011 — tabela email_log (istoricul emailurilor trimise)
-- Rulează MANUAL în Supabase SQL Editor.
--
-- ATENȚIE: tabela email_log existentă (schema veche, din migrarea 001)
-- nu a fost scrisă NICIODATĂ de aplicație — e sigur să o recreăm.
-- Dacă între timp conține date, NU rula DROP-ul; adaptează manual.
-- ============================================================

DROP TABLE IF EXISTS public.email_log;

CREATE TABLE public.email_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email      TEXT        NOT NULL,
  subject       TEXT        NOT NULL,
  kind          TEXT        NOT NULL CHECK (kind IN ('decizie', 'confirmare_pacient', 'feedback')),
  case_id       UUID        REFERENCES public.cases(id) ON DELETE SET NULL,
  status        TEXT        NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_log_kind_created ON public.email_log(kind, created_at DESC);
CREATE INDEX idx_email_log_case ON public.email_log(case_id) WHERE case_id IS NOT NULL;

-- Acces exclusiv prin service role (codul server-side); fără politici de
-- SELECT/INSERT pentru utilizatori — RLS activ blochează orice acces direct.
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- VERIFICARE: SELECT count(*) FROM public.email_log; -- 0 inițial
