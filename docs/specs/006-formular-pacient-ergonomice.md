# 006 — Formular pacient: îmbunătățiri ergonomice și de robustețe

**Status:** Draft
**Prioritate:** Medie
**Effort:** M (~40 min)
**Data:** 2026-05-28
**Autor:** SDD Pilot — Roxana + Claude

---

## Context

Formularul public `/` (componenta `PatientForm.tsx`) este principalul punct de intrare în platformă pentru pacienți. În audit am identificat câteva probleme care fac formularul fragil sau frustrant:

1. **Dead code:** există un branch `if (status === "success") return ...` (liniile 159–180 din `PatientForm.tsx`) care nu se mai execută niciodată, pentru că la succes `handleSubmit` face `router.push("/confirmare?...")` și navighează imediat. Branch-ul rămâne ca artefact dintr-o iterație anterioară.
2. **Data nașterii fără limită inferioară:** input-ul are `max={today}` dar `min` lipsește — un utilizator poate selecta `1800-01-01` și formularul trece.
3. **Lipsa limită totală pe upload:** fiecare fișier e limitat la 10 MB, dar un pacient poate atașa 20 de fișiere × 10 MB = 200 MB. Nu există o limită totală pe cerere și nici contor vizibil al spațiului ocupat.
4. **Pierdere de date la refresh:** dacă pacientul completează 80% din formular și browser-ul crash-uiește, totul e pierdut. Nu există auto-save în `localStorage`.
5. **Categorie fișier setată mereu pe „altele":** când un pacient adaugă 5 RMN-uri, trebuie să schimbe manual categoria fiecăruia. Lipsește un buton „Aplică categoria la toate fișierele" sau o euristică pe baza numelui fișierului.

## User stories

- **Ca pacient care completează cererea pe un dispozitiv lent**, vreau ca datele introduse să fie salvate local automat, ca să nu pierd 10 minute de tastat dacă mi se închide browser-ul.
- **Ca pacient care atașează mai multe documente medicale**, vreau să văd cât spațiu am ocupat total și să nu pot depăși o limită rezonabilă, ca să nu mă blochez la submit cu eroare de la server.
- **Ca pacient bătrân**, vreau ca selectorul de dată să refuze valori absurde (ex: 1850), ca să nu fiu confundat cu trimiterea unei cereri invalide.

## Acceptance criteria

1. **Branch-ul `status === "success"` din `PatientForm.tsx` este eliminat** — render-ul de succes există deja pe `/confirmare`, deci e dead code. Reducerea simplifică componenta.

2. **Data nașterii are `min` și `max` valide:**
   - `min={1900-01-01}` (limită rezonabilă, vârstă max ~126 ani)
   - `max={today}` (deja existent)
   - Mesaj de eroare clar dacă utilizatorul introduce manual o dată în afara intervalului (Zod refine în `patientSchema`).

3. **Limită totală pe upload — 50 MB:**
   - Constantă nouă `MAX_TOTAL_SIZE_MB = 50`
   - În `handleFiles`, după adăugare verifică suma `files.reduce((s, f) => s + f.size, 0)` și refuză cu mesaj clar: „Suma fișierelor depășește 50 MB. Elimină unele documente."
   - Sub lista de fișiere, afișez contor: „X / 50 MB folosit" (text mic, gri, devine roșu peste 80%).

4. **Auto-save în `localStorage`:**
   - Cheie: `dem-patient-draft-v1`
   - Câmpurile text (`nume`, `prenume`, `email`, `dataNasterii`, `telefon`, `descriere`) sunt persistate la fiecare `onChange` debounce 500ms.
   - **NU se persistă fișierele** (File objects nu sunt serializabile + risc de confuzie cu storage limits).
   - **NU se persistă `gdpr`** (consimțământul trebuie reconfirmat la fiecare cerere).
   - La mount, `useEffect` populează state-ul din `localStorage` dacă există draft.
   - La submit reușit (înainte de `router.push`), `localStorage.removeItem("dem-patient-draft-v1")`.
   - Mic indicator în UI: „Datele tale sunt salvate automat în acest browser" (text foarte mic, gri, sub butonul Submit).

5. **„Aplică categoria la toate" pentru fișiere:**
   - Lângă select-ul de categorie al primului fișier, un buton mic „Aplică la toate" care setează `fileCategories[name] = currentValue` pentru toate fișierele.
   - Vizibil doar dacă există ≥2 fișiere.

6. **Build clean** — `npx tsc --noEmit` + `npm run build` fără erori.

## Non-goals

- Nu adăugăm captcha / anti-spam (face obiectul unui spec separat dacă apare abuz real).
- Nu adăugăm upload de fișiere pe server progressively / chunked (50 MB total e perfect pentru un singur POST).
- Nu adăugăm preview pentru imagini în lista de fișiere — spec 009 acoperă preview-ul.
- Nu schimbăm structura câmpurilor sau Zod schema (rămân aceleași date colectate).

## Test plan

**Manual / Browser:**
- [ ] Completez 50% din formular, închid tab-ul, redeschid `/` — datele revin
- [ ] Trimit cererea cu succes — `localStorage` e curățat (verific în DevTools)
- [ ] Bifez GDPR, refresh — checkbox e neselectat (nu persistat)
- [ ] Adaug 6 fișiere a câte 9 MB — la al 6-lea primesc eroare „Suma depășește 50 MB"
- [ ] Tastez `01/01/1850` în câmpul data nașterii — Zod refuză cu mesaj clar
- [ ] Adaug 3 fișiere, schimb categoria primului pe „CT", apăs „Aplică la toate" — toate 3 devin „CT"

**Static:**
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` clean
- [ ] Grep `status === "success"` în `PatientForm.tsx` → zero match (branch eliminat)

## Files afectate

- `components/forms/PatientForm.tsx` — eliminare dead branch, adăugare auto-save, contor total size, validare data nașterii, buton „Aplică la toate".

## Diff plan (esența implementării)

**Constants:**
```ts
const MAX_TOTAL_SIZE_MB = 50;
const STORAGE_KEY = "dem-patient-draft-v1";
const MIN_BIRTH_DATE = "1900-01-01";
```

**Zod refinement pentru dataNasterii:**
```ts
dataNasterii: z.string()
  .min(1, "Data nașterii este obligatorie")
  .refine((v) => {
    const d = new Date(v);
    return d >= new Date(MIN_BIRTH_DATE) && d <= new Date();
  }, "Data nașterii trebuie să fie între 1900 și astăzi"),
```

**Auto-save effect:**
```ts
// Restore on mount
useEffect(() => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const draft = JSON.parse(raw);
      setFields((prev) => ({ ...prev, ...draft, gdpr: false }));
    } catch { /* ignore */ }
  }
}, []);

// Save on change (debounced)
useEffect(() => {
  const t = setTimeout(() => {
    const { gdpr: _gdpr, ...rest } = fields;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, 500);
  return () => clearTimeout(t);
}, [fields]);

// Clear on success — în handleSubmit, înainte de router.push:
localStorage.removeItem(STORAGE_KEY);
```

**Total size guard în handleFiles:**
```ts
const totalDupa = [...files, ...selected].reduce((s, f) => s + f.size, 0);
if (totalDupa > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
  setFileError(`Suma fișierelor depășește ${MAX_TOTAL_SIZE_MB} MB. Elimină unele documente.`);
  return;
}
```

**„Aplică la toate" buton — în secțiunea lista fișiere:**
```tsx
{files.length >= 2 && (
  <button
    type="button"
    onClick={() => {
      const cat = fileCategories[files[0].name] ?? "altele";
      setFileCategories(Object.fromEntries(files.map(f => [f.name, cat])));
    }}
    className="text-xs text-rose-400 hover:text-rose-500"
  >
    Aplică categoria primului fișier la toate
  </button>
)}
```
