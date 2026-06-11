# 008 — Dashboard medic: paginare, sortare și layout responsive

**Status:** Implemented — de verificat manual (build OK)
**Prioritate:** Medie
**Effort:** M (~50 min)
**Data:** 2026-05-28
**Autor:** SDD Pilot — Roxana + Claude

---

## Context

`/dashboard` afișează lista tuturor cazurilor printr-un tabel (`components/dashboard/CasesList.tsx`). Implementarea curentă are limitări care vor deveni problematice pe măsură ce baza de cazuri crește:

1. **Fără paginare:** Server-side în `app/(auth)/dashboard/page.tsx` (linia 33) face `.select("...").order("created_at", { ascending: false })` fără limită. La 500+ cazuri, payload-ul depășește 1 MB și pagina devine lentă. Toate cazurile sunt și transformate client-side (filtering, search) — costisitor.
2. **Doar o sortare:** mereu după `created_at desc`. Medicii vor să sorteze după status (cazurile noi prima), după progres (cazurile aproape complete), sau alfabetic după pacient.
3. **Layout-ul tabelar e greu de utilizat pe mobil:** `<table>` cu `overflow-x-auto` (linia 231 în `CasesList.tsx`) forțează scroll orizontal pe ecrane <640px. Doctorii care verifică cazurile de pe telefon trebuie să dea swipe orizontal pentru a vedea coloanele Progress și Actions.
4. **Statistici doar globale:** cele 3 carduri din `dashboard/page.tsx` (linii 156–166) numără pe toate cazurile din sistem. Lipsește un filtru rapid „doar cazurile mele" sau „cazurile fără evaluarea mea" — relevant pentru rolul logat.
5. **Filtrarea client-side după search nu e debounced:** la fiecare tastare se face un `.filter()` pe tot array-ul — ok la 50 cazuri, lent la 5000.

## User stories

- **Ca medic specialist**, vreau să văd întâi cazurile la care nu am completat încă evaluarea, ca să nu pierd timp căutând prin lista lungă.
- **Ca coordonator**, vreau să sortez după progres descrescător, ca să identific imediat cazurile gata de finalizat.
- **Ca medic care folosește telefonul în pauza între consultații**, vreau ca lista de cazuri să se afișeze ca un card-uri stivuite (nu tabel cu scroll orizontal), ca să dau swipe vertical natural.
- **Ca admin care vede un dashboard cu 800 de cazuri**, vreau ca pagina să se încarce sub 2 secunde, nu să aștept 8s pentru tot payload-ul.

## Acceptance criteria

1. **Paginare server-side, 25 cazuri pe pagină:**
   - În `dashboard/page.tsx`, query-ul Supabase folosește `.range((page - 1) * 25, page * 25 - 1)`.
   - `page` se citește din `searchParams.page` (string, default `"1"`).
   - Un al doilea query (numai `count`) returnează total: `service.from("cases").select("id", { count: "exact", head: true })`.
   - În UI, sub tabel: „Pagina X din Y" + butoane „← Anterioară" / „Următoarea →". Folosesc `<Link>` cu `?page=...` (păstrează SSR și URL shareable).

2. **Sortare prin select:**
   - Dropdown lângă filtrul de status în `CasesList.tsx`:
     - „Cele mai recente" (default — `created_at desc`)
     - „Cele mai vechi" (`created_at asc`)
     - „După status" (cazurile noi primele — `status` cu prioritate `nou > in_lucru > gata_expediere > trimis`)
     - „După progres" (descrescător)
     - „Alfabetic A-Z"
   - Selecția persistă în URL: `?sort=recent` / `?sort=progres` etc.
   - Sortarea după `status` și `progres` se face client-side pe pagina curentă (după ce vin cazurile paginate). Sortarea după `created_at` și `nume` se face în query Supabase (`.order()`).

3. **Filtru rapid „Doar relevante pentru mine":**
   - Un toggle deasupra tabelului: „Doar cazurile fără evaluarea mea" (vizibil doar pentru non-admin).
   - Activ → filtrează lista la cazurile unde `specialist_inputs` nu conține un row cu `user_id === user.id`.
   - Pentru rolul `admin`, toggle-ul nu apare (admin-ul nu evaluează).

4. **Layout responsive — card view pe mobil:**
   - Pe viewport <640px (`sm:`), tabelul se înlocuiește cu un set de card-uri stivuite vertical.
   - Fiecare card afișează: numele pacient (bold), email (sub, mic), data (dreapta sus), badge status (sub nume), bara de progres (full-width în card), buton „Deschide →" (sub bară, dreapta).
   - Pentru admin: pictograma de ștergere apare în colțul dreapta-jos al card-ului.
   - Pe viewport ≥640px, tabelul actual rămâne neschimbat.

5. **Debounce pe search:**
   - Input-ul de căutare folosește `useDeferredValue` (React 18+) sau debounce manual 200ms înainte de a propaga `cautare` în starea care declanșează `.filter()`.

6. **Build clean** — TS + ESLint + `npm run build`.

## Non-goals

- Nu adăugăm sortare per coloană prin click pe header (pattern „table headers" — overkill pentru număr mic de coloane).
- Nu adăugăm export CSV / Excel pe această iterație.
- Nu schimbăm logica de `specialist_inputs` din query (rămâne join-ul actual; doar folosim datele pentru filtrul nou).
- Nu adăugăm filtre după dată (range picker) — următoarea iterație.

## Test plan

**Manual / Browser (Claude in Chrome):**
- [ ] Pe `/dashboard` cu >50 cazuri seed: verific 25 pe pagină + butoane paginare funcționale.
- [ ] Schimb sortarea la „După progres" → cazurile cu 5/5 sus.
- [ ] Activez toggle „Doar fără evaluarea mea" → lista se reduce la cazurile unde nu apar în `specialist_inputs`.
- [ ] Resize la 390x844 → tabelul devine cards stivuite, fără scroll orizontal.
- [ ] Tastez rapid în search → contorul se actualizează după pauza de 200ms (nu la fiecare keystroke).
- [ ] Refresh pagina cu `?page=3&sort=progres` → starea se restaurează din URL.

**Static:**
- [ ] TS clean
- [ ] `npm run build` clean
- [ ] Verific că numărul de query-uri Supabase pe `/dashboard` rămâne ≤2 (cazurile + count).

## Files afectate

- `app/(auth)/dashboard/page.tsx` — paginare server-side, count query, citire `searchParams`.
- `components/dashboard/CasesList.tsx` — dropdown sortare, toggle „mine", layout cards mobil, debounce search, props noi.
- (potențial) `lib/constante.ts` — constantă `PAGE_SIZE = 25`.

## Diff plan (esența implementării)

**`dashboard/page.tsx`:**
```tsx
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { page?: string; sort?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1") || 1);
  const PAGE_SIZE = 25;
  const sort = searchParams.sort ?? "recent";

  // Map sort -> order
  const orderConfig =
    sort === "vechi" ? { column: "created_at", ascending: true } :
    sort === "alfa"  ? { column: "patient_name", ascending: true } :
    { column: "created_at", ascending: false };

  const { data: cazuriRaw, count } = await service
    .from("cases")
    .select("id, patient_name, ...", { count: "exact" })
    .order(orderConfig.column, { ascending: orderConfig.ascending })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const totalPagini = Math.ceil((count ?? 0) / PAGE_SIZE);
  // ... pass page, totalPagini, sort, userId la CasesList
}
```

**`CasesList.tsx`, card mobile (în loc de `<table>` la `sm:hidden`):**
```tsx
<div className="sm:hidden space-y-2">
  {cazuriFiltrate.map((caz) => (
    <div key={caz.id} className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium text-slate-900">{caz.patient_name}</p>
          <p className="text-xs text-slate-400">{caz.patient_email}</p>
        </div>
        <span className="text-xs text-slate-400">{formatData(caz.created_at)}</span>
      </div>
      <BadgeStatus status={caz.status} />
      <div className="mt-3">
        <BaraProgres completati={caz.completati} />
      </div>
      <div className="mt-3 flex justify-end">
        <Link href={`/caz/${caz.id}`} className="...">Deschide →</Link>
      </div>
    </div>
  ))}
</div>

<div className="hidden sm:block">
  {/* tabelul actual */}
</div>
```

**Paginare UI:**
```tsx
<nav className="mt-6 flex items-center justify-between text-sm">
  <Link
    href={`/dashboard?page=${page - 1}&sort=${sort}`}
    aria-disabled={page <= 1}
    className={page <= 1 ? "text-slate-300 pointer-events-none" : "text-rose-400 hover:text-rose-500"}
  >
    ← Anterioară
  </Link>
  <span className="text-slate-500">Pagina {page} din {totalPagini}</span>
  <Link
    href={`/dashboard?page=${page + 1}&sort=${sort}`}
    aria-disabled={page >= totalPagini}
    className={page >= totalPagini ? "text-slate-300 pointer-events-none" : "text-rose-400 hover:text-rose-500"}
  >
    Următoarea →
  </Link>
</nav>
```
