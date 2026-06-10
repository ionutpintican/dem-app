# 012 — Audit securitate & robustețe: acces, redirect, limite server, trimitere atomică

**Status:** Implemented — de verificat manual (build ✓, test plan manual în așteptare)
**Prioritate:** Critică (securitate + integritatea actului medical)
**Effort:** L (~90 min cod) + follow-up DB
**Data:** 2026-06-10
**Autor:** Audit complet proiect — Ionuț + Claude

---

## Context

Audit complet al proiectului (commits, specs, schemă, middleware, toate rutele API, componente)
din perspectivă produs / tehnic / securitate. Acest spec acoperă constatările de **securitate**
și **robustețe** care se pot rezolva în cod acum. Constatările care necesită acces la baza de
date live (migrări, `supabase db pull`) sunt documentate la „Follow-up DB" și vor primi spec
separat după sincronizarea schemei.

### Constatări (în ordinea priorității)

1. **`/caz/[id]` nu este rută protejată în middleware.** `middleware.ts:4` protejează doar
   `/dashboard`, `/admin`, `/profil`. Pagina de caz verifică doar autentificarea, nu și
   `is_active` — un doctor dezactivat/șters (soft delete) cu sesiune încă validă poate vedea
   orice caz și poate genera URL-uri semnate către fișiere medicale. Datele se citesc prin
   service client (bypass RLS), deci RLS nu compensează.

2. **Open redirect în `/auth/callback` și `/api/auth`.** Parametrul `next` din query string e
   concatenat direct: `NextResponse.redirect(`${origin}${next}`)`. Un link
   `?next=//evil.com` redirecționează după autentificare către un site extern (vector de
   phishing pe credențiale medicale). Cele două rute sunt de altfel duplicate identice.

3. **Endpoint-ul public `/api/cazuri/nou` nu are nicio limită server-side.** Clientul
   limitează la 10 MB/fișier, dar serverul acceptă orice număr de fișiere, orice dimensiune,
   orice MIME type, fără rate limiting. Risc: umplerea storage-ului (cost direct), spam,
   stocare de fișiere arbitrare.

4. **Race condition la trimiterea deciziei** (`/api/cazuri/[id]/trimite-decizia`). Fluxul e:
   citește status → trimite email → update status. Două cereri concurente (dublu-click, două
   taburi) trimit pacientului decizia de două ori.

5. **HTML injection în emailuri.** Concluzia specialistului e inserată fără `escapeHtml` în
   emailul cu decizia (`randSpecialist`), iar `numePacient` + `descriere` (input public!)
   intră neescapate în emailul de confirmare către pacient. `pacientName` neescapat și în
   emailul de decizie.

6. **Audit log nefiabil.** Rutele de cazuri scriu `resource_type`/`resource_id` (corect,
   conform `types/database.ts`), dar `DELETE /api/admin/users/[id]` scrie
   `table_name`/`record_id` — insert-ul eșuează silențios (try/catch ignorat), deci
   ștergerile de conturi nu apar în audit. Pentru o aplicație medicală sub GDPR, audit-ul
   trebuie să fie garantat.

7. **Diverse:** emailul developerului hardcodat în `/api/feedback`; fără max-length pe
   feedback și pe inputurile specialiștilor (mesaje de 1 MB posibile); parola temporară din
   `AdminPanel` generată cu `Math.random()` (nu e criptografic sigur); `parola_temporara`
   nevalidată server-side la creare cont; etichetele de categorie fișier din `/caz/[id]`
   (`analiza|imagistica|reteta|trimitere`) nu corespund categoriilor reale salvate de
   formular (`ct|rmn|ecografie|radiografie|biopsie|analize|scrisoare`) — doctorii văd cheia
   brută.

## User stories

- **Ca administrator**, când dezactivez sau șterg contul unui doctor, vreau ca accesul lui la
  fișele pacienților să înceteze imediat, inclusiv pe pagina de caz, ca să respect obligațiile
  GDPR față de pacienți.
- **Ca doctor**, vreau ca un link de autentificare manipulat să nu mă poată redirecționa pe un
  site extern care imită platforma, ca să nu-mi fie furate credențialele.
- **Ca proprietar al platformei**, vreau ca formularul public să refuze server-side upload-uri
  excesive sau tipuri de fișiere neacceptate, ca să nu pot fi sabotat prin costuri de storage.
- **Ca pacient**, vreau să primesc decizia echipei o singură dată, chiar dacă coordonatorul
  apasă de două ori pe buton, ca să nu fiu derutat de emailuri duplicate.
- **Ca administrator pe partea legală**, vreau ca fiecare ștergere de cont să fie înregistrată
  în audit log, ca să pot demonstra conformitatea.

## Acceptance criteria

### A. Acces `/caz` (constatarea 1)
1. `/caz` este adăugat în `protectedRoutes` din `middleware.ts` — utilizatorii nelogați sunt
   redirecționați la `/autentificare`, iar cei cu `is_active = false` sunt delogați și blocați
   (comportamentul existent al middleware-ului se aplică acum și aici).
2. Defense-in-depth: pagina `caz/[id]/page.tsx` verifică `profil.is_active` și face
   `redirect("/autentificare?eroare=cont-dezactivat")` dacă e fals sau profilul lipsește.

### B. Open redirect (constatarea 2)
3. În `/auth/callback` și `/api/auth`, `next` e acceptat doar dacă începe cu `/` și nu cu
   `//` sau `/\` — altfel se folosește `/dashboard`.

### C. Limite server-side formular public (constatarea 3)
4. `/api/cazuri/nou` impune server-side: max 20 fișiere, max 10 MB/fișier, max 50 MB total,
   allowlist MIME (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`, DOC/DOCX).
   Fișierele care nu trec sunt respinse cu 422 și mesaj clar (nu ignorate silențios).
5. `descriere` are max 5000 caractere, `nume`/`prenume` max 100, `telefon` max 20 (Zod).
6. Rate limiting in-memory per IP pe POST `/api/cazuri/nou`: max 5 cereri / 10 minute.
   (Best-effort pe serverless — instanțe separate au contoare separate; suficient contra
   abuzului naiv. Upgrade la Upstash/Vercel Firewall notat la Non-goals.)

### D. Trimitere decizie atomică + escape (constatările 4–5)
7. `trimite-decizia` face compare-and-swap **înainte** de email: `UPDATE cases SET
   status='trimis' ... WHERE id=? AND status NOT IN ('trimis','arhivat')` cu `SELECT`
   de verificare; dacă niciun rând nu e afectat → 409 „deja trimisă". Dacă emailul eșuează
   după CAS, statusul e restaurat (rollback compensator) și se întoarce 500.
8. Toate valorile dinamice din template-urile de email sunt trecute prin `escapeHtml`:
   concluziile specialiștilor, `pacientName`, `numePacient`, `descrierePrescurtata`,
   `coordonatorName`.

### E. Audit log + diverse (constatările 6–7)
9. `DELETE /api/admin/users/[id]` scrie audit cu `resource_type`/`resource_id` (schema reală).
10. Emailul de feedback merge la `process.env.FEEDBACK_EMAIL` (fallback pe valoarea actuală).
11. `/api/feedback` respinge mesaje > 5000 caractere; `/api/cazuri/[id]/input` și
    `/concluzie` resping `content` serializat > 50 KB.
12. `genereazaParola()` din `AdminPanel` folosește `crypto.getRandomValues`.
13. `POST /api/admin/users` validează `parola_temporara` server-side (min 8, o majusculă,
    o cifră — aceleași reguli ca `registerSchema`).
14. `ETICHETA_CATEGORIE` din `caz/[id]/page.tsx` acoperă categoriile reale ale formularului
    (CT, RMN, Ecografie, Radiografie, Biopsie, Analize, Scrisoare medicală, Altele).

## Non-goals (follow-up DB / spec separat)

- **Sincronizarea schemei** (`supabase db pull` + `supabase gen types`) și eliminarea
  cast-urilor `as never` / `as unknown as` — necesită acces la proiectul Supabase live.
- **Persistarea consimțământului GDPR** (timestamp + versiune text) — necesită coloană nouă.
- **Logging download fișiere + retry email + `email_log`** — acoperite de spec 009/011.
- **CAPTCHA (Turnstile) și rate limiting durabil (Upstash)** — necesită conturi/chei externe.
- **CI (GitHub Actions: tsc + lint + build) și teste** — spec separat.
- Consolidarea `verificaAdmin`/`escapeHtml`/template email comun — spec 011.

## Test plan

**Build:** `npm run build` trece fără erori TS/ESLint.

**Manual:**
- [ ] User dezactivat cu sesiune activă → `/caz/<id>` redirecționează la autentificare.
- [ ] `/auth/callback?code=x&next=//evil.com` → redirect la `/dashboard`, nu extern.
- [ ] POST `/api/cazuri/nou` cu fișier .exe sau >10 MB → 422 cu mesaj clar.
- [ ] 6 POST-uri rapide la `/api/cazuri/nou` de pe același IP → al 6-lea primește 429.
- [ ] Dublu-click pe „Trimite decizia" → un singur email, al doilea răspuns 409.
- [ ] Concluzie specialist cu `<img src=x onerror=...>` → apare ca text în email.
- [ ] Ștergere cont doctor → rând nou în `audit_logs` cu `resource_type='users'`.
- [ ] Fișier categorie „ct" → eticheta „CT" pe pagina cazului.

## Ordinea de implementare

1. A (middleware + pagină) — 15 min
2. B (open redirect) — 5 min
3. C (limite server + rate limit) — 30 min
4. D (CAS + escape) — 25 min
5. E (audit + diverse) — 20 min
