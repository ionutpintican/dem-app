import Link from "next/link";
import HeaderBrand from "@/components/layout/HeaderBrand";
import CardDoctor from "@/components/echipa/CardDoctor";
import { ECHIPA, CATEGORII_ETICHETE, ORDINEA_CATEGORII } from "@/lib/echipa";

export const metadata = {
  title: "Echipa medicală | Decizia Oncologică",
  description:
    "Specialiștii care evaluează cazurile oncologice prin platforma Decizia Oncologică.",
};

export default function EchipaPage() {
  const grupate = ECHIPA.reduce(
    (acc, d) => {
      (acc[d.categorie] ??= []).push(d);
      return acc;
    },
    {} as Record<string, typeof ECHIPA>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <HeaderBrand href="/" />
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Înapoi acasă
            </Link>
            <Link
              href="/autentificare"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Autentificare personal →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 text-pretty">
          Echipa medicală
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Specialiștii noștri evaluează fiecare cerere cu atenție, colaborând
          multidisciplinar pentru a vă oferi cea mai bună decizie medicală.
        </p>
      </section>

      {/* Secțiuni pe specialități */}
      <main className="max-w-6xl mx-auto px-4 pb-20 space-y-14">
        {ORDINEA_CATEGORII.filter((cat) => grupate[cat]?.length > 0).map((cat) => (
          <section key={cat}>
            <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200">
              {CATEGORII_ETICHETE[cat]}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {grupate[cat].map((doctor) => (
                <CardDoctor key={doctor.nume} doctor={doctor} />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Footer minimal */}
      <footer className="border-t border-slate-200 bg-white/60">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap justify-center gap-6 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600 transition-colors">
            Solicită asistență medicală
          </Link>
          <span>·</span>
          <Link href="/autentificare" className="hover:text-slate-600 transition-colors">
            Autentificare personal
          </Link>
        </div>
      </footer>
    </div>
  );
}
