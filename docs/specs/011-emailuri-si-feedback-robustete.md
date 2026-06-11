# 011 — Emailuri & feedback: robustețe, retry și template comun

**Status:** Implemented — de verificat manual (build OK; migrarea 003 trebuie rulata manual in SQL Editor)
**Prioritate:** Medie
**Effort:** M (~60 min)
**Data:** 2026-05-28
**Autor:** SDD Pilot — Roxana + Claude

---

## Context

Aplicația trimite emailuri prin Resend (`lib/email/resend.ts`) din mai multe locuri:

- `app/api/cazuri/nou/route.ts` — email de confirmare către pacient.
- `app/api/cazuri/[id]/trimite-decizia/route.ts` — email cu decizia finală către pacient.
- `app/api/feedback/route.ts` — email sugestie către dezvoltator.

Implementarea curentă are câteva limitări:

1. **HTML duplicat în fiecare endpoint:** culorile, layout-ul, header-ul, footer-ul sunt inline-uite în fiecare route. Schimbarea unei culori (ca în spec 004) presupune editarea a 3–4 fișiere și e ușor de uitat undeva. Nu există un helper `renderEmailTemplate({ titlu, blocuri, footer })`.
2. **Fără retry pe erori tranzitorii:** `sendEmail` aruncă direct la primul fail. Resend poate eșua tranzitor (5xx, rate limit) — la trimiterea unei decizii medicale, lipsa retry-ului înseamnă pacient care nu primește decizia până la următoarea acțiune manuală.
3. **Fără queue / status persistent:** dacă `sendEmail` aruncă în `/trimite-decizia/route.ts`, statusul cazului poate rămâne incoerent (probabil deja s-a făcut update la `decision_sent_at` înainte de send? trebuie verificat). Nu există tabela `email_log` cu status `pending/sent/failed/retried`.
4. **`FeedbackModal` trimite ca user logat, dar admin-ul nu vede modal-ul:** în `dashboard/page.tsx` (linia 96) `FeedbackModal` se afișează doar pentru `!esteAdmin`. Admin-ul nu poate trimite feedback prin UI (oarecum intenționat — el e admin-ul), dar dacă vrea totuși să raporteze ceva tehnic, nu are mecanism.
5. **`FeedbackModal` are limită implicită (textarea fără max), poate fi abuzat:** un user rău intenționat poate trimite un mesaj de 1 MB. Nu există rate-limit nici un max-length în `/api/feedback`.
6. **Conținut email scapă HTML corect, dar nu și URL-urile signed:** dacă în viitor includem un link signed în corpul emailului (ex: descarcă PDF cu decizia), HTML-ul actual nu sanitizează href-uri (deși acum nu există în payload).
7. **Lipsește indicator de status real în UI:** după `Trimite decizia pacientului`, UI-ul arată „Decizia a fost trimisă" pe baza `cazStatus === "trimis"`. Dar dacă emailul a eșuat la Resend după ce status-ul a fost setat (race condition cu order incorrect), UI-ul minte. Trebuie ordine clară: send email → la succes set status.

## User stories

- **Ca coordonator care apasă „Trimite decizia"**, vreau garanția că dacă apăs și văd „Trimis", emailul a ajuns efectiv la Resend cu succes — nu doar că am marcat în DB.
- **Ca dezvoltator care primește feedback**, vreau ca formatul email-ului să fie consistent cu celelalte template-uri (pacient, decizie), ca să recunosc rapid sursa.
- **Ca admin**, vreau să văd un log al emailurilor trimise (cui, când, status), ca să pot răspunde la „pacientul X spune că nu a primit decizia" cu certitudine.
- **Ca utilizator obișnuit**, vreau să nu pot trimite mesaje feedback abuzive (>5000 caractere sau de 100 ori pe minut).

## Acceptance criteria

1. **Helper `renderEmailTemplate` reutilizabil:**
   - Fișier nou `lib/email/template.ts`:
     ```ts
     export function renderEmailTemplate(opts: {
       titluHeader: string;
       subtitluHeader?: string;
       continut: string; // HTML deja escapat
       footerText?: string;
     }): string
     ```
   - Returnează HTML cu header roz `#f43f5e`, container 560px, footer cu „Trimis automat din platforma Decizia Oncologică".
   - Toate cele 3 endpoint-uri actuale (feedback, cazuri/nou, trimite-decizia) îl folosesc — duplicate de HTML eliminate.

2. **Retry cu exponential backoff în `sendEmail`:**
   - Modificare `lib/email/resend.ts`:
     - Try → la error, dacă e 5xx sau timeout, retry de max 2 ori cu pauză 500ms, 1500ms.
     - 4xx (cum ar fi 422 invalid email) NU se retry-uiește.
   - Throw doar după ce toate retry-urile au eșuat.

3. **Tabela `email_log` și logging:**
   - Migration nouă: `email_log (id, to_email, subject, kind, case_id?, status, error_message?, sent_at, created_at)`.
   - În `sendEmail`, primește un parametru opțional `kind: "decizie" | "confirmare_pacient" | "feedback"` și opțional `caseId`.
   - Înainte de send: `insert({ status: "pending" })` → returnează id-ul.
   - La succes: `update({ status: "sent", sent_at: now() })`.
   - La eșec final: `update({ status: "failed", error_message })`.

4. **Ordine corectă în `trimite-decizia`:**
   - Verifică în `app/api/cazuri/[id]/trimite-decizia/route.ts`:
     1. Render email.
     2. `sendEmail()` (cu retry).
     3. **Doar la succes** → `update cases set status = "trimis", decision_sent_at = now()`.
   - Dacă orderul actual e invers, refactor.

5. **Rate-limit + max-length pe feedback:**
   - În `/api/feedback/route.ts`, după parse-ul body-ului:
     - `if (mesaj.length > 5000) return 422 "Mesajul depășește 5000 de caractere"`.
   - Rate limit per user: max 5 feedback-uri / 10 minute (folosim `email_log` cu `kind: "feedback"` și un count pe ultimele 10 min).

6. **Admin poate folosi feedback:**
   - Eliminăm condiția `!esteAdmin` din `dashboard/page.tsx` (linia 96) — admin-ul vede butonul de feedback. În `/api/feedback/route.ts` eliminăm check-ul `if (profil.role === "admin") return 403`.

7. **UI status real în CoordinatorPanel:**
   - La apăsare „Trimite decizia", răspunsul de la API confirmă explicit `{ ok: true, sent: true }` doar dacă send-ul a reușit + DB s-a actualizat. UI afișează succesul doar la `data.sent === true`. Dacă send-ul eșuează după update DB (caz teoretic ce nu ar trebui să existe după criteriul 4), UI afișează warning roșu „Status actualizat dar emailul a eșuat. Contactează admin."

8. **Build + tests:**
   - TS clean.
   - Migration aplicată.
   - Test manual: setez `RESEND_API_KEY` invalid → la trimitere primesc eroare clară + `email_log.status = "failed"`.

## Non-goals

- Nu adăugăm UI admin pentru `email_log` (pagina /admin/emailuri) — face obiectul unui spec separat dacă apare necesitate.
- Nu adăugăm scheduled retry pentru emailuri failed (cron job care reia send-uri eșuate) — overkill, retry-ul în-process e suficient.
- Nu schimbăm structura conținutului emailurilor (paragrafele, secțiunile, ordinea info-urilor) — doar layout-ul comun.
- Nu adăugăm SMS sau alte canale de notificare.
- Nu adăugăm webhook-uri Resend pentru status tracking (bounce, complaint) — opțional viitor.

## Test plan

**Manual:**
- [ ] Trimit o cerere de test → primesc email pacient + verific `email_log` cu `kind: "confirmare_pacient", status: "sent"`.
- [ ] Trimit decizia → email pacient + `email_log.kind = "decizie"`.
- [ ] Setez temporar `RESEND_API_KEY` invalid → trimit cerere → primesc 500 cu mesaj clar + `email_log.status = "failed"`.
- [ ] Apăs Feedback de 6 ori în 1 minut → al 6-lea primește 429 „Prea multe mesaje".
- [ ] Tastez 5500 caractere în feedback → 422 înainte de send.
- [ ] Ca admin, văd butonul Feedback și pot trimite.

**Vizual:**
- [ ] Compar emailurile actuale (înainte) cu cele noi (după) — același aspect vizual, dar HTML mai curat (poate verifica printr-un email client care arată sursa).

**Static:**
- [ ] TS clean
- [ ] `npm run build` clean
- [ ] Migration aplicată: `select count(*) from email_log` returnează 0 inițial.

## Files afectate

**Noi:**
- `lib/email/template.ts` — helper `renderEmailTemplate`.
- `supabase/migrations/<timestamp>_email_log.sql` — tabela.

**Modificate:**
- `lib/email/resend.ts` — retry, logging, parametru `kind`/`caseId`.
- `app/api/feedback/route.ts` — rate-limit, max-length, folosește helper, eliminare guard admin.
- `app/api/cazuri/nou/route.ts` — folosește helper.
- `app/api/cazuri/[id]/trimite-decizia/route.ts` — folosește helper, ordine send-then-update.
- `app/(auth)/dashboard/page.tsx` — eliminare `!esteAdmin` la `FeedbackModal`.
- `components/forms/CoordinatorPanel.tsx` — citește `data.sent` din response.

## Diff plan (esența implementării)

**Migration `email_log.sql`:**
```sql
CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('decizie', 'confirmare_pacient', 'feedback')),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_log_kind_created ON email_log(kind, created_at DESC);
CREATE INDEX idx_email_log_case ON email_log(case_id) WHERE case_id IS NOT NULL;
```

**`lib/email/template.ts`:**
```ts
export function renderEmailTemplate({
  titluHeader, subtitluHeader, continut, footerText,
}: {
  titluHeader: string;
  subtitluHeader?: string;
  continut: string;
  footerText?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ro"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:#f43f5e;padding:24px 32px;">
            <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.5px;">${titluHeader}</span>
            ${subtitluHeader ? `<span style="color:#fce7f3;font-size:13px;margin-left:12px;">· ${subtitluHeader}</span>` : ""}
          </td>
        </tr>
        <tr><td style="padding:28px 32px 0;">${continut}</td></tr>
        <tr>
          <td style="padding:16px 32px 24px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              ${footerText ?? "Trimis automat din platforma Decizia Oncologică"}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
```

**Retry în `resend.ts`:**
```ts
async function sendOnce(payload) { /* resend.emails.send */ }

export async function sendEmail({ to, subject, html, kind, caseId }) {
  const log = await service.from("email_log").insert({
    to_email: Array.isArray(to) ? to[0] : to,
    subject, kind, case_id: caseId ?? null, status: "pending",
  }).select("id").single();

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const data = await sendOnce({ to, subject, html });
      await service.from("email_log")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", log.data.id);
      return data;
    } catch (e: any) {
      lastErr = e;
      const status = e?.status ?? e?.statusCode;
      if (status && status < 500 && status !== 429) break; // 4xx (except rate limit) — nu retry
      await new Promise(r => setTimeout(r, 500 * Math.pow(3, attempt)));
    }
  }
  await service.from("email_log")
    .update({ status: "failed", error_message: String(lastErr).slice(0, 500) })
    .eq("id", log.data.id);
  throw lastErr;
}
```

**Rate-limit feedback:**
```ts
// În /api/feedback/route.ts după guard-uri:
const recent = await service
  .from("email_log")
  .select("id", { count: "exact", head: true })
  .eq("kind", "feedback")
  .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
if ((recent.count ?? 0) >= 5) {
  return NextResponse.json({ error: "Prea multe mesaje. Așteaptă câteva minute." }, { status: 429 });
}
if (mesaj.length > 5000) {
  return NextResponse.json({ error: "Mesajul depășește 5000 de caractere." }, { status: 422 });
}
```
