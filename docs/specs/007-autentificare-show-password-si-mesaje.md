# 007 — Autentificare: vizibilitate parolă + mesaje contextuale și rate-limit

**Status:** Draft
**Prioritate:** Medie
**Effort:** S (~30 min)
**Data:** 2026-05-28
**Autor:** SDD Pilot — Roxana + Claude

---

## Context

Fluxul de autentificare (`/autentificare`) și resetare (`/resetare-parola`, `/resetare-parola/actualizeaza`) funcționează corect, dar are câteva neajunsuri ergonomice care duc la confuzie sau frustrare:

1. **Lipsește butonul „Arată parola"** — un doctor obișnuit cu parole generate de admin (12+ caractere, mix de simboluri) introduce orbește o parolă lungă; o singură greșeală îl trimite în loop „Email sau parolă incorectă".
2. **Mesaj de eroare generic** — în `FormAutentificare` (linia 32), orice eroare Supabase devine „Email sau parolă incorectă. Verifică datele și încearcă din nou." Asta acoperă și cazul cont dezactivat (deși există un check separat în query string `?eroare=cont-dezactivat`, el funcționează doar dacă serverul redirect-ează cu acel param — nu se setează la `signInWithPassword` client-side).
3. **Fără mesaj de avertizare la încercări repetate** — Supabase aplică rate-limiting (după ~5 încercări greșite), dar UI-ul afișează același mesaj generic. Doctorul nu știe că trebuie să aștepte 60s.
4. **`/resetare-parola` expune detalii Supabase** — la `error`, mesajul afișează `error.message` raw, care poate fi „rate limit exceeded" sau „User not found" și poate dezvălui dacă un email există în sistem (probleme de enumerare).
5. **Pagina de actualizare parolă nouă nu validează puterea parolei** — utilizatorul poate seta `12345678` (sau orice are 6+ caractere, default Supabase). Nu există un indicator de putere și nici reguli explicite.

## User stories

- **Ca medic care primește o parolă temporară lungă pe SMS de la admin**, vreau un buton „arată parola" la autentificare, ca să verific că am tastat corect simbolurile și să intru din prima.
- **Ca administrator**, vreau ca pagina de resetare să nu dezvăluie dacă un email există în baza de date, ca să respect best-practices anti-enumerare.
- **Ca medic cu parola temporară**, vreau ca la setarea parolei noi să primesc cerințe clare (minim 8 caractere, cu cel puțin o cifră) și un indicator vizual de putere, ca să nu mă blochez la „minim 6 caractere" tăcut.

## Acceptance criteria

1. **Buton „Arată parola" pe `/autentificare`:**
   - Icon ochi (SVG inline) în interiorul input-ului, dreapta, vertical-centered.
   - Click toggle-uiește `type` între `password` și `text`.
   - `aria-label` dinamic: „Arată parola" / „Ascunde parola".
   - Comportament identic și pe `/resetare-parola/actualizeaza` (toate input-urile de tip parolă).

2. **Mesaj de eroare mai informativ pe `/autentificare`:**
   - Dacă `error.message` conține „Invalid login credentials" → mesaj actual.
   - Dacă conține „Email not confirmed" (caz rar la noi pentru că admin-ul setează confirm) → „Adresa de email nu a fost încă confirmată. Contactează administratorul."
   - Dacă conține „rate limit" sau status `429` → „Prea multe încercări. Așteaptă 60 de secunde înainte de a încerca din nou." + dezactivează butonul submit 60s cu countdown.
   - Toate celelalte erori păstrează mesajul generic, dar logăm `console.error(error)` pentru debug.

3. **Mesaj generic „Dacă există, vei primi un email" pe `/resetare-parola`:**
   - În prezent (linia 28): `setEroare(\`A apărut o eroare: ${error.message}\`);` expune detalii.
   - Modificare: indiferent de rezultat (`error` sau succes), afișează **același** mesaj „Email trimis!" cu textul „Dacă adresa există în sistem, vei primi un link de resetare." (deja există acest text — trebuie doar ca branch-ul `eroare` să nu mai apară pentru utilizator final; eroarea se loghează în consolă cu `console.error`).
   - Excepție: dacă `error.message` conține „rate limit" → afișează „Prea multe cereri. Așteaptă câteva minute." (utilizatorul trebuie să știe că trebuie să retry).

4. **Validare putere parolă pe `/resetare-parola/actualizeaza`:**
   - Minim 8 caractere
   - Cel puțin o literă mare ȘI o cifră (regex `(?=.*[A-Z])(?=.*\d).{8,}`)
   - Indicator vizual sub input: 3 bare colorate (slab / mediu / puternic) bazate pe lungime + diversitate.
   - Submit dezactivat dacă criteriile nu sunt îndeplinite.
   - Confirmare parolă (re-tastare) — câmp suplimentar, must match.

5. **Build + a11y:**
   - Butonul show-password e accesibil cu tastatură (Tab focus + Enter activează).
   - TypeScript clean, ESLint clean.

## Non-goals

- Nu adăugăm autentificare prin OTP / magic link în acest spec.
- Nu adăugăm „Remember me" — Supabase persistă session implicit prin cookies.
- Nu modificăm fluxul `/auth/callback` (server-side handling rămâne identic).
- Nu adăugăm captcha sau hCaptcha (face obiectul unui spec separat dacă apare abuz).

## Test plan

**Manual / Browser:**
- [ ] Pe `/autentificare`, tastez parola, apăs ochi → text vizibil. Apăs din nou → ascuns.
- [ ] Greșesc parola de 6 ori rapid — primesc mesaj rate-limit + countdown 60s pe buton.
- [ ] Pe `/resetare-parola`, introduc email inexistent → primesc același „Email trimis!" ca pentru un email valid.
- [ ] Pe `/resetare-parola/actualizeaza`, tastez `12345678` → submit dezactivat, indicator „slab".
- [ ] Tastez `Parola2026` → indicator „puternic", submit activ.
- [ ] Confirmare parolă diferită → eroare „Parolele nu coincid".

**Static:**
- [ ] TypeScript clean
- [ ] Build clean

## Files afectate

- `app/autentificare/page.tsx` — toggle show-password + rate-limit handling.
- `app/resetare-parola/page.tsx` — mesaj generic indiferent de eroare (cu excepție rate-limit).
- `app/resetare-parola/actualizeaza/page.tsx` — validare putere + confirmare parolă + show-password.

## Diff plan (esența implementării)

**Component reutilizabil `PasswordInput` (sau inline):**
```tsx
const [showPwd, setShowPwd] = useState(false);
// ...
<div className="relative">
  <input
    type={showPwd ? "text" : "password"}
    // ...
    className="... pr-10"
  />
  <button
    type="button"
    onClick={() => setShowPwd(v => !v)}
    aria-label={showPwd ? "Ascunde parola" : "Arată parola"}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
  >
    {showPwd ? <EyeOffIcon /> : <EyeIcon />}
  </button>
</div>
```

**Maparea erorilor în `/autentificare`:**
```ts
function mapeazaEroare(err: { message?: string; status?: number }): string {
  const msg = err.message?.toLowerCase() ?? "";
  if (err.status === 429 || msg.includes("rate limit")) {
    return "Prea multe încercări. Așteaptă 60 de secunde înainte de a încerca din nou.";
  }
  if (msg.includes("email not confirmed")) {
    return "Adresa de email nu a fost încă confirmată. Contactează administratorul.";
  }
  return "Email sau parolă incorectă. Verifică datele și încearcă din nou.";
}
```

**Validare parolă nouă:**
```ts
const PAROLA_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
function calculeazaPutere(p: string): "slab" | "mediu" | "puternic" {
  if (p.length < 8) return "slab";
  if (PAROLA_REGEX.test(p) && p.length >= 12) return "puternic";
  if (PAROLA_REGEX.test(p)) return "mediu";
  return "slab";
}
```
