# 002 — Header dashboard pe mobil: nu se aglomerează

**Status:** Approved
**Prioritate:** Medie
**Effort:** S (~20 min)
**Data:** 2026-05-26
**Autor:** SDD Pilot — Roxana + Claude

---

## Context

În audit am văzut că pe viewport <768px header-ul dashboard-ului (și admin-ului, profil-ului) se aglomerează:
- Textul "Decizia Oncologică" se rupe pe 2 rânduri ("Decizia" / "Oncologică")
- Subtitlu "Platformă IOCN Cluj-Napoca" încă vizibil pe mobil
- Butonul "Sugerează îmbunătățiri" arată cu text complet
- Cardul profil + butonul Deconectare cu text — toate înghesuite pe un singur rând horizontal

Rezultatul: header-ul ocupă 3 rânduri și pare dezorganizat pe mobil.

## User stories

- **Ca medic care folosește dashboard-ul pe telefon**, vreau ca header-ul să fie compact și lizibil pe ecran mic, ca să nu pierd spațiu vertical valoros și să găsesc rapid butoanele.

## Acceptance criteria

1. **Brand-ul nu se rupe pe 2 rânduri pe mobil** — Pe viewport <640px (Tailwind `sm`), textul "Decizia Oncologică" e ascuns sau redus, lăsând doar logo-ul IOCN + (opțional) text mic "Decizia Oncologică" pe o singură linie. Subtitlul "Platformă IOCN Cluj-Napoca" e ascuns pe mobil (deja are `hidden sm:block`, dar text-ul mare deasupra încă wrap-ează).

2. **Butonul feedback compact pe mobil** — Pe viewport <640px, "Sugerează îmbunătățiri" devine doar iconiță (bulbul). Deja există `<span className="hidden sm:inline">` pentru text, dar trebuie verificat că funcționează corect.

3. **Cardul profil compact pe mobil** — Pe viewport <640px, în loc de "Nume + Rol" textul de lângă avatar, e ascuns; vizibil doar avatarul-iconiță (cerc cu silueta). Click pe avatar duce la `/profil` (comportament neschimbat).

4. **Butonul Deconectare compact pe mobil** — Pe viewport <640px, textul "Deconectare" ascuns, vizibil doar iconița săgeată-ieșire. Tooltip / aria-label rămâne descriptiv.

5. **Header pe un singur rând pe mobil** — La 390px lățime (iPhone), toate elementele headerului trebuie să încapă pe un singur rând fără wrap și fără overflow horizontal.

6. **Header-ul rămâne neschimbat pe desktop (≥640px)** — Toate textele și etichetele rămân vizibile pe desktop ca acum. Doar comportamentul sub `sm` se modifică.

7. **Pagini afectate** — Aceeași logică se aplică pentru header-ul de pe `/dashboard`, `/admin`, `/profil`. Componenta `HeaderBrand` poate primi o prop pentru a controla afișarea textului.

## Non-goals

- Nu adăugăm hamburger menu / drawer pe mobil (overkill pentru numărul mic de acțiuni).
- Nu schimbăm header-ul de pe `/caz/[id]` (face obiectul unui alt spec 003).
- Nu schimbăm header-urile paginilor publice (autentificare, resetare-parola etc.) — alea sunt deja minimaliste.

## Test plan

**Manual / Browser (Claude in Chrome):**
- [ ] Resize la 390x844 (iPhone 14)
- [ ] Navigate `/dashboard` → screenshot → verific 1 rând, brand pe 1 linie sau ascuns text
- [ ] Verific click pe avatar duce la `/profil`
- [ ] Verific click pe iconița feedback deschide modal
- [ ] Verific click pe iconița deconectare face logout
- [ ] Resize la 1440x900 → verific că arată ca acum (textele complete vizibile)
- [ ] Repeat pe `/admin` și `/profil`

## Files afectate

- `components/layout/HeaderBrand.tsx` — adaug variantă "compactă" sau ascund textul pe mobil cu `hidden sm:flex`.
- `app/(auth)/dashboard/page.tsx` — în cardul profil-link, ascund textul pe `sm:` (deja are `hidden sm:flex flex-col items-start` — funcționează, dar avatar-ul rămâne vizibil singur, ok).
- `app/(auth)/admin/page.tsx` — același pattern.
- `app/(auth)/profil/page.tsx` — același pattern.
- Butonul Deconectare: text-ul "Deconectare" devine `hidden sm:inline` în toate 3 pagini.

## Diff plan (esența implementării)

**HeaderBrand:** ascund "Decizia Oncologică" text pe mobil; sau îl reduc la text mic.

```tsx
// Înainte:
<div className="flex flex-col leading-tight border-l border-slate-200 pl-2.5">
  <span className="text-lg font-bold text-green-800">Decizia Oncologică</span>
  <span className="text-xs text-slate-500 hidden sm:block">Platformă IOCN Cluj-Napoca</span>
</div>

// După:
<div className="hidden sm:flex flex-col leading-tight border-l border-slate-200 pl-2.5">
  <span className="text-lg font-bold text-green-800">Decizia Oncologică</span>
  <span className="text-xs text-slate-500">Platformă IOCN Cluj-Napoca</span>
</div>
```

**Buton Deconectare în dashboard/admin/profil:**
```tsx
// Înainte:
<button ...>
  <svg ... />
  Deconectare
</button>

// După:
<button ... aria-label="Deconectare">
  <svg ... />
  <span className="hidden sm:inline">Deconectare</span>
</button>
```
