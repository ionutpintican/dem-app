# 009 — Pagina caz: prevenire conflicte la editare + preview imagini

**Status:** Draft
**Prioritate:** Înaltă (afectează integritatea datelor medicale)
**Effort:** L (~75 min)
**Data:** 2026-05-28
**Autor:** SDD Pilot — Roxana + Claude

---

## Context

Pagina `/caz/[id]` este nucleul aplicației — aici medicii vizualizează un caz, atașează evaluarea (`SpecialistInputForm`), iar coordonatorul finalizează cu o concluzie și trimite decizia (`CoordinatorPanel`). În audit am identificat câteva probleme reale:

1. **Conflict de editare silent overwrite:** dacă doi medici cu același rol (ex: doi oncologi) deschid simultan formularul, fiecare salvează `valori` ca un POST nou la `/api/cazuri/[id]/input` cu propriul `user_id`. Schema actuală permite mai multe `specialist_inputs` per rol per caz (nu există unique constraint pe `(case_id, role_at_time)`). Rezultat: ambele evaluări se păstrează, dar pe `dashboard/page.tsx` (linia 51) `Set` deduplică după `role_at_time` și progresul rămâne corect. Problema reală: **același utilizator** poate edita simultan în două tab-uri și a doua salvare suprascrie prima fără avertisment, pentru că `inputulMeu` se preia după `(user_id, !is_coordinator_conclusion)` (linia 126) — al doilea POST creează un al doilea row, iar la următorul refresh `find()` returnează primul găsit (ordine necunoscută).
2. **Fără preview pentru imagini medicale:** `case_files` cu MIME `image/*` (CT, RMN, ecografii) se afișează doar ca link de download (`caz/[id]/page.tsx` linia 247). Doctorul trebuie să descarce fiecare imagine, să o deschidă într-un alt program și să revină la tab. Pentru un caz cu 8 imagini, asta înseamnă 16 schimbări de context.
3. **Audit log incomplet:** `audit_logs.insert({ action: "view" })` se face la fiecare load al paginii (linia 105), dar nu se loghează:
   - Download-ul unui fișier (signed URL e generat la load — orice clic e netrasabil)
   - Edit-ul unei evaluări existente (POST la `/input` reia același endpoint pentru create + update)
   - Finalizarea / trimiterea deciziei
   - Redeschiderea fișei
4. **Status „trimis" nu blochează editarea în UI consistent:** `SpecialistInputForm` ascunde butonul Editează (linia 70: `{!esteFinalizat && <button>Editează</button>}`), dar dacă utilizatorul are deja `editeaza=true` în state și statusul se schimbă în alt tab, formularul rămâne deschis. Nu există revalidare la focus.
5. **Concluzia coordonatorului nu se confirmă la suprascriere:** dacă există o concluzie salvată și coordonatorul deschide editarea, modifică textul, apoi închide tab-ul fără să salveze, nu primește nicio avertizare (textul nu e persistat în `localStorage`).

## User stories

- **Ca medic care editează același caz pe laptop și pe telefon**, vreau să primesc un avertisment dacă salvarea mea ar suprascrie o versiune mai recentă a aceleiași evaluări, ca să nu pierd accidental modificări.
- **Ca radiolog**, vreau să previzualizez imaginile (CT, RMN) direct în pagină, ca să nu downloadez fiecare PDF/imagine separat când evaluez 10 cazuri pe zi.
- **Ca administrator pe partea legală**, vreau ca fiecare descărcare de fișier medical să fie înregistrată în `audit_logs`, ca să pot răspunde la o eventuală cerere GDPR cu un log complet.
- **Ca coordonator**, vreau ca dacă uit să salvez concluzia editată și închid tab-ul, browserul să mă întrebe „Ești sigur că vrei să părăsești pagina?".

## Acceptance criteria

1. **Optimistic concurrency check pe `specialist_inputs`:**
   - `inputulMeu` din `caz/[id]/page.tsx` (linia 126) primește și `updated_at`.
   - `SpecialistInputForm` primește prop `inputUpdatedAt: string | null`.
   - La submit POST la `/api/cazuri/[id]/input`, body-ul include `expected_updated_at`.
   - API-ul în `app/api/cazuri/[id]/input/route.ts` verifică: dacă există deja un input pentru `(case_id, user_id, !is_coordinator_conclusion)` și `updated_at !== expected_updated_at`, returnează 409 Conflict cu body `{ error: "Conflict", current_content: {...} }`.
   - În UI, la 409, afișez un dialog: „Evaluarea a fost modificată de altcineva (sau de tine în alt tab). Vrei să suprascrii sau să anulezi?" cu butoane „Suprascrie" / „Reîncarcă".

2. **Deduplicare backend `(case_id, user_id, !is_coordinator_conclusion)`:**
   - În aceeași sesiune de migrare, adăugăm UNIQUE constraint în DB (`specialist_inputs_user_case_unique`).
   - Apoi în API, în loc de `.insert()`, folosim `.upsert({ on_conflict: "case_id,user_id,is_coordinator_conclusion" })`.
   - Migrarea este idempotentă: înainte de a adăuga constraint-ul, ștergem duplicatele păstrând ultimul `updated_at`.

3. **Preview pentru imagini:**
   - În `caz/[id]/page.tsx`, înainte de a face `createSignedUrl`, identific MIME prin `file_name` extension sau salvat în `case_files.mime_type` (dacă există coloana — altfel inferez din extensie).
   - Pentru fișiere cu MIME `image/*` (jpg, jpeg, png, webp): la click pe card, în loc de download direct, deschidem un modal lightbox cu `<img src={signedUrl} />` la dimensiune fit-screen + buton „Descarcă" jos.
   - Pentru PDF (`application/pdf`): continuăm să deschidem în tab nou (browserul are viewer nativ — comportament actual păstrat, dar marcăm vizual cu icon diferit „PDF").
   - Pentru doc/docx: comportament actual (download forțat).
   - Lightbox-ul are: ESC închide, săgeți ←→ navighează între imagini, click pe overlay închide.

4. **Audit log extins:**
   - `download` — la prima generare de signed URL pentru un fișier specific din lightbox sau click PDF/doc (nu la load page).
   - `edit_input` — în `/api/cazuri/[id]/input` când e update (vs. create).
   - `send_decision` — în `/api/cazuri/[id]/trimite-decizia` la succes.
   - `reopen_case` — în `/api/cazuri/[id]/redeschide` la succes.
   - Toate folosesc forma actuală: `{ user_id, action, resource_type, resource_id, case_id }`.

5. **Beforeunload guard în `CoordinatorPanel` și `SpecialistInputForm`:**
   - Hook `useEffect` cu `window.addEventListener("beforeunload", ...)` activ doar când `editeaza === true` ȘI există modificări neсalvate (compare `valori` cu `inputExistent`).
   - Browserul afișează prompt-ul standard „Sunt modificări nesalvate. Vrei să părăsești pagina?".

6. **Revalidare la focus / status change:**
   - În pagina `/caz/[id]`, adaug un `useEffect` cu `window.addEventListener("focus", router.refresh)` (sau folosesc Supabase Realtime — opțional, vezi Non-goals).
   - Asta forțează re-fetch când userul revine pe tab; status-ul se actualizează și `esteFinalizat` se recalculează.

7. **Build clean + RLS check:**
   - Endpoint-urile noi (sau modificate) respectă același pattern de auth (`createClient` + `supabase.auth.getUser`).
   - Politica RLS pe `case_files` permite signed URL doar pentru utilizatori autentificați (deja e cazul prin `createServiceClient`, dar verificăm).

## Non-goals

- **NU adăugăm** Supabase Realtime subscriptions pe `specialist_inputs` (overkill pentru frecvența editărilor; revalidare la focus e suficientă).
- **NU schimbăm** structura tabelei `specialist_inputs` (doar adăugăm UNIQUE constraint).
- **NU adăugăm** comments/discussions între specialiști pe caz (face obiectul unui spec separat).
- **NU implementăm** PDF preview inline custom (browserele native sunt suficiente).
- **NU adăugăm** funcția de „revert la versiunea anterioară" — pentru audit complet ar trebui o tabelă `specialist_inputs_history`.

## Test plan

**Manual (multi-tab):**
- [ ] Deschid același caz în 2 tab-uri, editez în primul, salvez, apoi încerc să salvez în al doilea cu `expected_updated_at` vechi → primesc dialog conflict.
- [ ] Aleg „Reîncarcă" → state-ul se actualizează cu conținutul curent.
- [ ] Aleg „Suprascrie" → POST trece cu `expected_updated_at: null` (force) și salvare reușește.

**Manual (preview):**
- [ ] Adaug un caz cu un CT (image/jpeg) + un PDF + un docx.
- [ ] Click pe CT → se deschide lightbox.
- [ ] Săgeată dreapta → trec la PDF (sau dacă PDF nu e în lightbox, navighez doar între imagini și pentru PDF/docx comportament actual).
- [ ] ESC închide.
- [ ] Click „Descarcă" în lightbox → fișierul se descarcă + audit_logs are entry `download`.

**Manual (audit):**
- [ ] Editez evaluarea → `audit_logs` are entry `edit_input`.
- [ ] Trimit decizia → entry `send_decision`.
- [ ] Redeschid fișa → entry `reopen_case`.

**Manual (beforeunload):**
- [ ] Editez concluzia, încerc să închid tab-ul fără save → browser arată confirmare.
- [ ] Salvez, încerc să închid → fără confirmare.

**Static:**
- [ ] TS + ESLint + build clean.
- [ ] Migration SQL pentru UNIQUE constraint testată pe instanță locală Supabase (`supabase db reset` apoi `supabase db push`).

## Files afectate

**Noi:**
- `supabase/migrations/<timestamp>_unique_specialist_input.sql` — adaugă constraint + dedup.
- `components/caz/LightboxFisiere.tsx` — modal lightbox imagini.

**Modificate:**
- `app/(auth)/caz/[id]/page.tsx` — pass `inputUpdatedAt` la `SpecialistInputForm`, pass `fisiereWithUrls` la lightbox, audit `view` neschimbat.
- `components/forms/SpecialistInputForm.tsx` — prop `inputUpdatedAt`, handle 409, beforeunload guard.
- `components/forms/CoordinatorPanel.tsx` — beforeunload guard pentru concluzie.
- `app/api/cazuri/[id]/input/route.ts` — verificare `expected_updated_at`, audit `edit_input`.
- `app/api/cazuri/[id]/trimite-decizia/route.ts` — audit `send_decision`.
- `app/api/cazuri/[id]/redeschide/route.ts` — audit `reopen_case`.

## Diff plan (esența implementării)

**Migration SQL (idempotentă):**
```sql
-- Pas 1: șterge duplicatele păstrând cel mai recent updated_at
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY case_id, user_id, is_coordinator_conclusion
    ORDER BY updated_at DESC
  ) AS rn
  FROM specialist_inputs
)
DELETE FROM specialist_inputs WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Pas 2: adaugă unique constraint
ALTER TABLE specialist_inputs
  ADD CONSTRAINT specialist_inputs_user_case_unique
  UNIQUE (case_id, user_id, is_coordinator_conclusion);
```

**API conflict handling în `/api/cazuri/[id]/input/route.ts`:**
```ts
const { content, expected_updated_at } = await req.json();
const { data: existing } = await service
  .from("specialist_inputs")
  .select("id, updated_at")
  .eq("case_id", id)
  .eq("user_id", user.id)
  .eq("is_coordinator_conclusion", false)
  .maybeSingle();

if (existing && expected_updated_at && existing.updated_at !== expected_updated_at) {
  return NextResponse.json(
    { error: "Conflict", code: "STALE_VERSION" },
    { status: 409 }
  );
}
// Apoi upsert.
```

**Client conflict UI în `SpecialistInputForm`:**
```tsx
if (resp.status === 409) {
  setStare("conflict");
  return;
}
// ...
{stare === "conflict" && (
  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
    <p className="text-sm font-semibold text-amber-800">Modificare detectată</p>
    <p className="text-xs text-amber-700 mt-1">
      Evaluarea a fost actualizată de altcineva (sau de tine în alt tab).
    </p>
    <div className="mt-3 flex gap-2">
      <button onClick={() => router.refresh()} className="...">Reîncarcă</button>
      <button onClick={forteazaSalvare} className="...">Suprascrie</button>
    </div>
  </div>
)}
```

**Beforeunload hook reutilizabil:**
```ts
function useUnsavedGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}
```
