# 003 — HeaderBrand consistent pe pagina /caz/[id]

**Status:** Approved
**Prioritate:** Medie
**Effort:** S (~15 min)
**Data:** 2026-05-26
**Autor:** SDD Pilot — Roxana + Claude

---

## Context

În audit am observat că pagina de detaliu caz `/caz/[id]` are un header minimalist: doar breadcrumb "< Dashboard / [Nume pacient]" + nume user + buton deconectare. Lipsește logo-ul IOCN + textul "Decizia Oncologică" prezente pe celelalte pagini autentificate (dashboard, admin, profil).

Asta creează inconsistență vizuală — user-ul intră într-o pagină de evaluare medicală importantă și pierde brand-ul instituțional din header.

## User stories

- **Ca medic specialist care lucrează la un caz**, vreau să văd consistent logo-ul IOCN + "Decizia Oncologică" în header pe toate paginile autentificate, ca să am încredere că sunt în platforma corectă și să mențin un sentiment de încredere instituțională.

## Acceptance criteria

1. **HeaderBrand prezent pe `/caz/[id]`** — În colțul stânga-sus al header-ului apare logo-ul IOCN + "Decizia Oncologică" + subtitlu "Platformă IOCN Cluj-Napoca" (identic cu dashboard).

2. **Breadcrumb-ul rămâne, dar mutat** — Breadcrumb-ul curent "< Dashboard / [Nume pacient]" rămâne, dar e poziționat în continuarea HeaderBrand-ului (după un separator vertical sau cu spațiere clară). Nu se elimină — păstrează navigarea funcțională.

3. **Click pe brand duce la dashboard** — Click pe logo-ul IOCN sau "Decizia Oncologică" navighează la `/dashboard`. Click pe "Dashboard" din breadcrumb la fel.

4. **Header rămâne pe un singur rând pe desktop** — La viewport ≥1024px, brand + breadcrumb + numele user + buton logout încap toate pe un singur rând fără wrap.

5. **Pe mobil header-ul nu wrap-ează urât** — La viewport <640px, dacă spațiul e insuficient, breadcrumb-ul se reduce la doar "<" (back arrow) + ultimul element (nume pacient). Sau breadcrumb-ul merge pe a doua linie sub HeaderBrand. (Decizia se ia la implementare, dar criteriul e: nu arată dezorganizat.)

6. **Stilul header-ului consistent cu celelalte** — `bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm` (identic cu dashboard/admin/profil).

## Non-goals

- Nu schimbăm conținutul paginii (date pacient, progres echipă, evaluări).
- Nu refactorizăm header-ul într-o componentă comună (deși ar fi logic — îl lăsăm pe altă iterație).
- Nu adăugăm avatar profil pe această pagină — header-ul rămâne mai puțin aglomerat decât dashboard-ul.

## Test plan

**Manual / Browser (Claude in Chrome):**
- [ ] Navigate la `/caz/[id]` cu user autentificat
- [ ] Screenshot desktop (1440x900) → verific HeaderBrand vizibil + breadcrumb funcțional
- [ ] Click pe logo IOCN → verific navigare la `/dashboard`
- [ ] Click pe "Dashboard" din breadcrumb → verific navigare la `/dashboard`
- [ ] Resize la 390x844 → screenshot → verific că header-ul nu e haotic
- [ ] Compare side-by-side cu screenshot vechi (înainte de fix) — îmbunătățire clară

## Files afectate

- `app/(auth)/caz/[id]/page.tsx` — restructurez `<header>` să includă HeaderBrand la stânga, breadcrumb după el.

## Diff plan (esența implementării)

```tsx
// Înainte (simplificat):
<header className="bg-white border-b border-slate-200 shadow-sm">
  <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Link href="/dashboard">... Dashboard</Link>
      <span>/</span>
      <span>{caz.patient_name}</span>
    </div>
    <div>{numele user-ului} + logout</div>
  </div>
</header>

// După:
<header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
  <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
    <div className="flex items-center gap-4 min-w-0">
      <HeaderBrand href="/dashboard" />
      <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 min-w-0">
        <span>/</span>
        <span className="font-medium text-slate-900 truncate">{caz.patient_name}</span>
      </div>
    </div>
    <div>{numele user-ului} + logout</div>
  </div>
</header>
```

Notă: breadcrumb-ul mut din spatele HeaderBrand-ului devine `hidden md:flex` pe ecrane mici, sau menținem versiunea cu doar săgeată "<".
