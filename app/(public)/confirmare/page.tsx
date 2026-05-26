import Link from "next/link";

export const metadata = {
  title: "Cerere trimisă | Decizia Oncologică",
};

export default function ConfirmarePage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const idScurt = searchParams.id
    ? searchParams.id.slice(0, 8).toUpperCase()
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full text-center">

        {/* Iconița succes */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 mb-8">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Cererea a fost trimisă!
        </h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Echipa medicală a primit cererea ta și o va analiza în cel mai scurt timp.
          Vei primi decizia pe adresa de email furnizată.
        </p>

        {/* ID caz */}
        {idScurt && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              ID cerere
            </p>
            <p className="text-3xl font-bold text-rose-400 tracking-widest font-mono">
              {idScurt}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Păstrează acest cod pentru referință
            </p>
          </div>
        )}

        {/* Pași */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 text-left">
          <p className="text-sm font-semibold text-slate-700 mb-4">Ce urmează?</p>
          <div className="space-y-3">
            {[
              "Ai primit un email de confirmare cu detaliile cererii.",
              "Fiecare specialist din echipă analizează cazul tău.",
              "Când toți specialiștii au completat, primești decizia pe email.",
            ].map((pas, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{pas}</p>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Trimite o altă cerere
        </Link>

      </div>
    </div>
  );
}
