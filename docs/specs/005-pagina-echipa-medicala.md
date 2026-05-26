# 005 — Pagina publică „Echipa medicală"

**Status:** Approved
**Prioritate:** Medie
**Effort:** M (~45 min)
**Data:** 2026-05-26
**Autor:** SDD Pilot — Roxana + Claude

---

## Context

Aplicația are nevoie de o pagină publică care prezintă **echipa medicală** care evaluează cererile pacienților. Asta crește încrederea utilizatorilor și transparența. Sursa datelor: lista preluată manual de la `https://ctm.iocn.ro/echipa/` (sursă pe care utilizatorul a indicat-o explicit) — dar pagina rezultată **NU menționează IOCN/CTM** (per spec 004).

Pagina e publică, accesibilă din:
- Homepage pacient (link în header sau în zona "info" jos)
- Login page (mic CTA)

## User stories

- **Ca pacient care depune o cerere medicală**, vreau să văd cine sunt medicii care îmi vor analiza cazul, ca să am încredere în decizia primită.
- **Ca medic care folosește platforma**, vreau o pagină publică unde colegii mei să fie listați, ca să mă regăsesc cu poză și specialitate.

## Acceptance criteria

1. **Rută nouă `/echipa`** — Pagină publică (no auth needed). Adăugată în `app/(public)/echipa/page.tsx`. Inclusă în `(public)` group ca să nu fie protejată de middleware.

2. **Header consistent cu restul paginilor publice** — Include HeaderBrand + link "← Înapoi acasă" sau "Autentificare personal →". Fundal decorativ roz vizibil.

3. **Hero section** — Titlu mare "Echipa medicală", subtitlu scurt (1-2 propoziții): explică pe scurt că aceștia sunt specialiștii care evaluează cazurile prin platformă.

4. **Grupare pe specialități** — Doctorii sunt grupați în secțiuni cu titlu de categorie:
   - **Radiologie și imagistică**
   - **Oncologie medicală**
   - **Chirurgie oncologică**
   - **Chirurgie plastică și reconstructivă**
   - **Radioterapie**
   - **Genetică**
   - **Psiho-oncologie**
   - **Anatomie patologică** (opțional dacă există)

5. **Card per doctor** — Pentru fiecare medic, un card cu:
   - **Poză** (square, 160-200px) — `<img>` direct cu URL extern (hotlink din ctm.iocn.ro). Pentru medicii fără poză, placeholder cu inițialele numelui pe fond roz pudrat.
   - **Nume complet** (cu titlu academic: Dr., Conf. Dr., Prof. Dr., Psh.)
   - **Specialitate / rol** (text mic, secundar)
   - **Eventual badge "Coordonator"** unde scrie "Coordonator..." în descriere

6. **Layout responsive**:
   - Desktop (≥1024px): grid 4 coloane pe row
   - Tablet (≥640px): 3 coloane
   - Mobil (<640px): 2 coloane

7. **Datele într-un fișier separat** — `lib/echipa.ts` exportă array-ul de doctori (nume, specialitate, imgUrl, categorie). Asta permite editare ușoară fără a atinge componentă React.

8. **Doar doctorii — fără personal auxiliar** — În prima iterație, NU includem asistente medicale, kinetoterapeut, coordonator programări. Doar cei 24 medici + 2 psihologi din lista CTM. (Pot fi adăugați ulterior cu update la `lib/echipa.ts`.)

9. **NU apare "IOCN" / "CTM" pe pagină** — Verificare:
   - Texte pe pagină: zero menționare IOCN/CTM
   - Metadata title page: "Echipa medicală | Decizia Oncologică"
   - Tooltip-uri / alt text imagini: doar numele doctorului
   - URL-urile imaginilor (hotlink din ctm.iocn.ro) sunt în atributul `src` — invizibile pentru user obișnuit. Acceptabil.

10. **Link din homepage și login** — Adaug un mic link "Cunoaște echipa medicală →" în:
    - Footer-ul `(public)/page.tsx` (homepage pacient) — sub form, lângă "Date criptate SSL"
    - `/autentificare` — sub "PENTRU PACIENȚI", lângă "Depune o cerere medicală"

11. **Imagini next.config / regimul Next.js** — Cum folosim `<img>` direct (nu `next/image`), nu trebuie modificat `next.config.mjs`. Compromis: pierdem optimizarea Next.js, dar simplitate. *Acceptabil pentru v1.*

12. **Loading time acceptabil** — Pagina trebuie să randeze sub 2s pe 3G simulat (Network throttling în DevTools). 26 imagini × ~50KB = ~1.3MB total. Acceptabil dar atenție la lazy loading (`loading="lazy"` pe img sub fold).

## Non-goals

- Nu modificăm pagina IOCN sursă.
- Nu adăugăm filtrare / căutare în pagină în v1.
- Nu adăugăm bio detaliat per doctor (doar nume + specialitate).
- Nu adăugăm "click pe poză → modal cu detalii". Card-ul e static.
- Nu sincronizăm automat cu IOCN — datele sunt hardcoded în `lib/echipa.ts`.
- Nu descărcăm imaginile local (hotlink). Optimizare ulterioară opțională.

## Test plan

**Static (cod):**
- [ ] TypeScript clean
- [ ] Build clean

**Vizual (Claude in Chrome după deploy):**
- [ ] Navigate `/echipa` → screenshot full page
- [ ] Verific: 26 medici grupați pe categorii
- [ ] Verific: pozele se încarcă (network requests)
- [ ] Verific: doctorii fără poză au placeholder cu inițiale
- [ ] Curl `/echipa` HTML + `grep -i iocn` → ZERO ocurențe
- [ ] Verific link din homepage merge la /echipa
- [ ] Verific link din /autentificare merge la /echipa

**Responsive:**
- [ ] Screenshot la 1440px — grid 4 coloane
- [ ] Screenshot la 768px — grid 3 coloane (sau cum decidem)
- [ ] Screenshot la 390px — grid 2 coloane

## Files afectate

**Noi:**
- `app/(public)/echipa/page.tsx` — componenta pagină
- `lib/echipa.ts` — array de doctori
- `components/echipa/CardDoctor.tsx` — card vizual reutilizabil

**Modificate:**
- `app/(public)/page.tsx` — adaug link spre /echipa
- `app/autentificare/page.tsx` — adaug link spre /echipa

## Diff plan (esența implementării)

**lib/echipa.ts:**
```ts
export type Doctor = {
  nume: string;
  specialitate: string;
  imgUrl: string | null;
  categorie: "radiologie" | "oncologie" | "chirurgie_oncologica" | "chirurgie_plastica" | "radioterapie" | "genetica" | "psihologie";
  esteCoordonator?: boolean;
};

export const ECHIPA: Doctor[] = [
  { nume: "Dr. Carmen Lisencu", specialitate: "Medic primar radioterapie, competență senologie imagistică", imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2023/01/Dr.-Carmen-Lisencu_ctm.jpg", categorie: "radiologie" },
  { nume: "Dr. Pintican Roxana", specialitate: "Medic specialist radiologie și imagistică medicală", imgUrl: "https://ctm.iocn.ro/wp-content/uploads/2024/10/dr-pintican-roxana.png", categorie: "radiologie" },
  // ... etc, toți 26
];

export const CATEGORII_ETICHETE: Record<string, string> = {
  radiologie: "Radiologie și imagistică",
  oncologie: "Oncologie medicală",
  chirurgie_oncologica: "Chirurgie oncologică",
  chirurgie_plastica: "Chirurgie plastică și reconstructivă",
  radioterapie: "Radioterapie",
  genetica: "Genetică",
  psihologie: "Psiho-oncologie",
};
```

**page.tsx (schematic):**
```tsx
import { ECHIPA, CATEGORII_ETICHETE } from "@/lib/echipa";
import HeaderBrand from "@/components/layout/HeaderBrand";
import CardDoctor from "@/components/echipa/CardDoctor";

export const metadata = {
  title: "Echipa medicală | Decizia Oncologică",
};

export default function EchipaPage() {
  // Grupare pe categorii
  const grupate = ECHIPA.reduce((acc, d) => {
    (acc[d.categorie] ??= []).push(d);
    return acc;
  }, {} as Record<string, typeof ECHIPA>);

  return (
    <div className="min-h-screen">
      <header>...HeaderBrand + link înapoi...</header>
      <main>
        <h1>Echipa medicală</h1>
        <p>Specialiștii care evaluează cazurile prin platformă.</p>
        {Object.entries(grupate).map(([cat, doctori]) => (
          <section key={cat}>
            <h2>{CATEGORII_ETICHETE[cat]}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {doctori.map(d => <CardDoctor key={d.nume} doctor={d} />)}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
```

**CardDoctor.tsx:**
```tsx
export default function CardDoctor({ doctor }: { doctor: Doctor }) {
  const initiale = doctor.nume.split(" ").filter(p => !p.endsWith(".")).slice(0, 2).map(p => p[0]).join("");
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {doctor.imgUrl ? (
        <img src={doctor.imgUrl} alt={doctor.nume} className="w-full aspect-square object-cover" loading="lazy" />
      ) : (
        <div className="w-full aspect-square bg-rose-100 flex items-center justify-center text-rose-500 text-3xl font-bold">{initiale}</div>
      )}
      <div className="p-4">
        <p className="text-sm font-semibold text-slate-900">{doctor.nume}</p>
        <p className="text-xs text-slate-500 mt-0.5">{doctor.specialitate}</p>
      </div>
    </div>
  );
}
```

## Ordine de implementare cu spec 004

Spec 004 (tema roz) trebuie implementat **înainte** de spec 005 (echipa), pentru ca CardDoctor să folosească direct `bg-rose-100` etc., nu să codez verde și apoi să schimb.
