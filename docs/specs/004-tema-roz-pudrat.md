# 004 — Temă roz pudrat și eliminare branding IOCN

**Status:** Approved
**Prioritate:** Înaltă (afectează identitatea vizuală)
**Effort:** M (~45 min)
**Data:** 2026-05-26
**Autor:** SDD Pilot — Roxana + Claude

---

## Context

Aplicația folosește în prezent o temă verde inspirată din logo-ul IOCN, cu logo-ul PNG IOCN în header și subtitlu "Platformă IOCN Cluj-Napoca". Utilizatorul vrea să trecem la o **temă roz pudrat** și să **eliminăm complet branding-ul IOCN** — nici logo, nici text "IOCN" nicăieri vizibil în UI sau emailuri.

Aplicația rămâne "Decizia Oncologică" ca brand, dar fără referințe instituționale.

## User stories

- **Ca utilizator (medic / pacient)**, vreau ca aplicația să aibă o identitate vizuală proprie (roz pudrat), separată de orice instituție, ca să nu existe confuzie sau asociere implicită cu IOCN.

## Acceptance criteria

1. **Logo-ul IOCN PNG dispare** — fișierul `public/iocn-logo.png` este șters și componenta `HeaderBrand` nu mai referențiază nicio imagine raster. În locul lui, un element vizual nou (vezi pct. 2).

2. **Element vizual brand nou** — În `HeaderBrand`, în locul logo-ului IOCN apare:
   - Un cerc/rounded-square cu inițialele "DO" în text alb pe fundal roz pudrat (rose-400 sau rose-500)
   - SAU un simbol SVG inline simplu (heart cu puls, stetoscop, sau cruce medicală)
   - Decizia finală: cerc cu "DO" — neutru, simplu, fără referințe instituționale

3. **Subtitlul "Platformă IOCN Cluj-Napoca" eliminat** — Componenta HeaderBrand nu mai afișează subtitlu. Rămâne doar "Decizia Oncologică" lângă logo.

4. **Tema verde înlocuită cu roz pudrat** în toate fișierele:
   - `green-700` (primary) → `rose-400` (#fb7185 — roz pudrat principal)
   - `green-800` (hover) → `rose-500` (#f43f5e)
   - `green-900` (active) → `rose-600`
   - `green-100` (badges, bg light) → `rose-100`
   - `green-50` (bg foarte pal) → `rose-50`
   - `green-200/300/400` → `rose-200/300/400` corespondente
   - `green-600` (succes, finalizate) → **rămâne verde** (rose nu e culoare de "succes"; opțional schimbat în `emerald-600` ca să nu fie confuzie). **Decizie:** rămâne `green-600` pentru semnale de succes (icons, "Cazuri finalizate", check marks).

5. **FundalDecorativ** actualizat — Gradientul de fundal și stroke-urile curbelor SVG devin roz:
   - Gradient: `#fce7f3 → #fdf2f8` (pink-100 → pink-50)
   - Stroke curbe: `#f43f5e` cu `opacity 0.08` (în loc de verde)

6. **Email templates** actualizate — Header-ul emailurilor pacient + feedback + decizie finală devine roz:
   - Background header: `#f43f5e` (rose-500) în loc de `#15803d`
   - Subtitlu pe roz: `#fce7f3` (pink-100) în loc de `#bbf7d0`
   - ID card pe pink-50 cu border pink-200
   - **Nu apare "IOCN"** în niciun email — verificat că subtitlurile cu "IOCN Cluj-Napoca" sunt eliminate

7. **Texte care menționează IOCN sunt actualizate**:
   - GDPR consent în `PatientForm.tsx` — în loc de "echipa medicală a Institutului Oncologic „Prof. Dr. Ion Chiricuță" Cluj-Napoca", devine "echipa medicală Decizia Oncologică"
   - Metadata title root layout: "Decizia Oncologică" (fără "— IOCN Cluj-Napoca")
   - Footer-ul emailului: nu menționează IOCN

8. **Color-uri specialități în badge-uri NU se schimbă** — În `lib/roluri.ts`, colors per rol (purple pentru radiolog, red pentru oncolog etc.) rămân ca acum. Sunt etichete distincte, nu temă principală.

9. **Console + build clean** — Zero erori TS / ESLint după modificări.

10. **Toate paginile testate vizual** — Homepage, login, reset, dashboard, profil, admin, caz/[id], echipa (după implementare spec 005) — toate trebuie să folosească consecvent tema roz.

## Non-goals

- Nu modificăm logica funcțională (autentificare, roluri, RLS rămân la fel).
- Nu refactorizăm componente (doar atingem CSS classes / valori).
- Nu schimbăm font-ul.
- Nu modificăm culorile roluri din `lib/roluri.ts`.

## Test plan

**Build:**
- [ ] `npx tsc --noEmit` — clean
- [ ] `npm run build` — clean

**Vizual (Claude in Chrome după deploy):**
- [ ] Screenshot homepage — fundalul e roz pal, butonul "Trimite cererea" roz, pași 1-2-3 roz
- [ ] Screenshot login — buton "Intră în cont" roz
- [ ] Screenshot dashboard — header brand "DO" + "Decizia Oncologică", fără logo IOCN; stat card "Cazuri noi" verde rămas
- [ ] Curl + grep `decizia-oncologica.ro/dashboard` HTML — zero ocurențe "IOCN" sau "iocn-logo"
- [ ] Curl /autentificare HTML — zero "IOCN"

**Email:**
- [ ] Trimitere cerere de test → verific email-ul primit are header roz + zero menționare IOCN

## Files afectate (estimare)

**Cod:**
- `app/layout.tsx` — metadata title
- `components/layout/HeaderBrand.tsx` — eliminare logo PNG, înlocuire cu DO + scoatere subtitlu
- `components/layout/FundalDecorativ.tsx` — gradient + culori curbe
- `components/forms/PatientForm.tsx` — text GDPR
- ~17 fișiere `.tsx` cu `green-*` → `rose-*`
- 4 fișiere email API templates — culori hex + texte IOCN
- `public/iocn-logo.png` — șters

**Specuri / docs:**
- Acest spec (acceptance criteria status updates)

## Diff plan (esența implementării)

**HeaderBrand:**
```tsx
// Înainte:
<Image src="/iocn-logo.png" ... />
<div className="hidden sm:flex flex-col leading-tight border-l border-slate-200 pl-2.5">
  <span className="font-bold text-green-800">Decizia Oncologică</span>
  <span className="text-xs text-slate-500">Platformă IOCN Cluj-Napoca</span>
</div>

// După:
<div className="w-10 h-10 rounded-full bg-rose-400 flex items-center justify-center shrink-0">
  <span className="text-white font-bold text-sm tracking-tight">DO</span>
</div>
<span className="hidden sm:inline font-bold text-rose-600 text-lg">Decizia Oncologică</span>
```

**Bulk replace în .tsx-uri** — PowerShell script ca la rebranding verde, cu mapping:
- `green-50` → `rose-50`
- `green-100` → `rose-100`
- `green-700` → `rose-400` (PRIMARY)
- `green-800` → `rose-500` (HOVER)
- ... etc.
- **EXCEPȚIE:** `green-600`, `green-500`, `bg-green-500` (succes/check marks) rămân nemodificate

**Email templates** — replace hex direct:
- `#15803d` → `#f43f5e`
- `#bbf7d0` → `#fce7f3`
- `#f0fdf4` → `#fdf2f8`
- `#dcfce7` → `#fce7f3`
- `#14532d` → `#9f1239`

Plus eliminare subtitlu IOCN din toate cele 3 email templates.
