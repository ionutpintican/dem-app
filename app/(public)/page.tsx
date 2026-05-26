import Link from "next/link";
import PatientForm from "@/components/forms/PatientForm";
import HeaderBrand from "@/components/layout/HeaderBrand";

export const metadata = {
  title: "Solicită asistență medicală | Decizia Oncologică",
  description:
    "Completează formularul de mai jos și un specialist din echipa noastră te va contacta cu decizia medicală.",
};

const PASI = [
  { nr: "1", label: "Completezi formularul" },
  { nr: "2", label: "Analizăm cererea" },
  { nr: "3", label: "Te contactăm prin email" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-rose-100/60 shadow-sm shadow-rose-100/30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <HeaderBrand href="/" />
          <div className="flex items-center gap-4">
            <Link
              href="/echipa"
              className="text-sm text-rose-500 hover:text-rose-700 font-medium transition-colors flex items-center gap-1.5"
            >
              <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Cunoaște echipa medicală
            </Link>
            <a
              href="/autentificare"
              className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              Autentificare personal →
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="main-content" className="max-w-3xl mx-auto px-4 pt-12 pb-8 text-center">

        {/* Eyebrow */}
        <div className="animate-fade-in inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-3 py-1 mb-5 uppercase tracking-wide">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
          Specialist oncologic disponibil
        </div>

        <h1 className="animate-fade-up delay-100 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-slate-900 mb-4 text-pretty">
          Solicită{" "}
          <span className="text-rose-500">asistență<br className="hidden sm:block" /> medicală</span>
        </h1>

        <p className="animate-fade-up delay-200 text-slate-500 max-w-md mx-auto leading-relaxed">
          Completează formularul și un specialist din echipa noastră te va contacta cu decizia medicală.
        </p>

        {/* Pași */}
        <div className="animate-fade-up delay-300 flex items-center justify-center mt-10">
          {PASI.map((pas, i) => (
            <div key={pas.nr} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-rose-200 ring-4 ring-rose-50">
                  {pas.nr}
                </div>
                <span className="text-slate-500 text-xs text-center max-w-[72px] leading-tight">{pas.label}</span>
              </div>
              {i < 2 && (
                <div className="w-12 sm:w-20 border-t border-dashed border-rose-200 mb-5 mx-2" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Card formular */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="animate-fade-up delay-400 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {/* Accent strip */}
          <div className="h-[3px] bg-gradient-to-r from-rose-400 via-rose-300 to-transparent" />
          <div className="p-6 sm:p-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-1 text-pretty">
              Date personale și descrierea cazului
            </h2>
            <p className="text-sm text-slate-400 mb-8">
              Toate datele sunt criptate și protejate conform GDPR.
            </p>
            <PatientForm />
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <span className="flex items-center gap-1.5 bg-white/80 border border-slate-100 rounded-full px-3 py-1.5 text-xs text-slate-500 shadow-sm">
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Date criptate SSL
          </span>
          <span className="flex items-center gap-1.5 bg-white/80 border border-slate-100 rounded-full px-3 py-1.5 text-xs text-slate-500 shadow-sm">
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Conform GDPR
          </span>
        </div>
      </section>
    </div>
  );
}
