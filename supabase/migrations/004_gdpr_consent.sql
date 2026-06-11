-- ============================================================
-- Spec 012 follow-up — persistarea consimțământului GDPR
-- Rulează MANUAL în Supabase SQL Editor.
--
-- Art. 7 GDPR: consimțământul trebuie să fie demonstrabil.
-- Până acum gdpr === "true" era doar validat, nu și salvat.
-- ============================================================

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS gdpr_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gdpr_consent_version TEXT;

COMMENT ON COLUMN public.cases.gdpr_consent_at IS
  'Momentul la care pacientul a bifat consimțământul GDPR în formularul public';
COMMENT ON COLUMN public.cases.gdpr_consent_version IS
  'Versiunea textului de consimțământ afișat la momentul bifării (ex: 2026-06-v1)';

-- VERIFICARE:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'cases' AND column_name LIKE 'gdpr%';
