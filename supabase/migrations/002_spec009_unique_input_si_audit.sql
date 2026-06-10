-- ============================================================
-- Spec 009 — unicitate specialist_inputs + extindere audit_action
-- Rulează MANUAL în Supabase SQL Editor (schema live diferă de
-- migrarea 001 — vezi spec 012, follow-up „sincronizare schemă").
-- Idempotentă: poate fi rulată de mai multe ori fără efecte duble.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Dedup: păstrează cel mai recent input per
--    (case_id, user_id, is_coordinator_conclusion)
-- ────────────────────────────────────────────────────────────
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY case_id, user_id, is_coordinator_conclusion
    ORDER BY updated_at DESC, created_at DESC
  ) AS rn
  FROM public.specialist_inputs
)
DELETE FROM public.specialist_inputs
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- ────────────────────────────────────────────────────────────
-- 2. UNIQUE constraint — un singur input per user per caz
--    (separat pentru evaluare vs. concluzie de coordonator)
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'specialist_inputs_user_case_unique'
  ) THEN
    ALTER TABLE public.specialist_inputs
      ADD CONSTRAINT specialist_inputs_user_case_unique
      UNIQUE (case_id, user_id, is_coordinator_conclusion);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. Extinde enum-ul audit_action cu acțiunile noi
--    (codul folosește deocamdată valori existente — după
--    aplicarea migrării se poate trece pe valorile dedicate)
-- ────────────────────────────────────────────────────────────
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'download';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'send_decision';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'reopen';

-- ────────────────────────────────────────────────────────────
-- VERIFICARE
-- ────────────────────────────────────────────────────────────
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.specialist_inputs'::regclass;
-- SELECT unnest(enum_range(NULL::audit_action));
