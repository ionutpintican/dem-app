# 001 — Skeleton loading pe pagina /profil

**Status:** Verified ✅
**Prioritate:** Joasă
**Effort:** S (~15 min)
**Data:** 2026-05-26
**Autor:** SDD Pilot — Roxana + Claude

---

## Context

În auditul prod-ului am observat că `/profil` afișează ~5 secunde **doar un spinner mic** centrat pe ecran gol (cu fundalul decorativ), fără header sau structura paginii. Cauza: componenta porneșe cu `incarcare=true` și așteaptă un round-trip Supabase pentru a popula `profil` și `rolNou`.

UX-ul actual e inconsistent — restul paginilor render-ează headerul instant (server-side render) și conținutul se popularizează gradual. Aici utilizatorul vede ecran gol prea mult timp.

## User stories

- **Ca utilizator**, când dau click pe avatar-ul de profil din header, vreau să văd imediat structura paginii (header + carduri schițate), nu un spinner singur pe ecran gol, ca să știu unde am ajuns și ce încarcă.

## Acceptance criteria

1. **Header vizibil instant** — La intrarea pe `/profil`, în prima frame după navigare, HeaderBrand + butonul "← Dashboard" + numele user-ului trebuie să fie deja vizibile. Nu se așteaptă date din Supabase.

2. **Skeleton pentru cele 2 carduri** — Cardurile "Specializare medicală" și "Schimbare parolă" apar ca placeholder-uri cu blocuri gri animate (pulse), nu invizibile.

3. **Skeleton dispare când datele sosesc** — Când `profil` se popularizează, skeleton-urile se înlocuiesc cu formularele reale fără reflow vizibil (cardurile rămân pe aceleași poziții).

4. **Numele user-ului în header — fallback graceful** — Cât timp `profil` e null, în dreapta sus în loc de nume + rol se afișează nimic sau un mic skeleton text. Nu apare "undefined" sau "null".

5. **Admin-ul nu vede secțiunea specializare** — În finalul încărcării, dacă `profil.role === "admin"`, card-ul de specializare nu mai e afișat (comportament existent, păstrat).

## Non-goals

- Nu schimbăm logica de fetch (rămâne `useEffect` pe client). Refactor la server-component se poate face ulterior.
- Nu adăugăm skeleton pentru alte pagini în acest spec.
- Nu modificăm stilizarea finală a cardurilor — doar starea de loading.

## Test plan

**Manual (în browser):**
- [ ] Hard refresh pe `/profil` cu DevTools Network throttling = "Slow 3G"
- [ ] Verific că header + skeleton apar instant (sub 100ms)
- [ ] Verific că skeleton e animat (efect pulse)
- [ ] Verific că skeleton dispare gradual și formularele reale apar pe aceleași poziții
- [ ] Verific că pe admin nu apare card specializare după încărcare

**Vizual (screenshot prin Claude in Chrome):**
- [ ] Screenshot la momentul T=0 (după navigate, înainte de wait) — trebuie să vedem header + skeleton
- [ ] Screenshot la T=2s — trebuie să vedem conținutul real

## Files afectate

- `app/(auth)/profil/page.tsx` — restructurez return-ul pentru a randa mereu shell-ul (header + structura), iar conținutul cardurilor să fie condiționat de `incarcare`.

## Diff plan (esența implementării)

În loc de:
```tsx
if (incarcare) {
  return <Spinner pe ecran gol />;
}
return <Header + Carduri reale>;
```

Folosesc:
```tsx
return (
  <>
    <Header />  {/* mereu vizibil */}
    {incarcare ? <SkeletonCards /> : <RealCards />}
  </>
);
```
