import Link from "next/link";
import PatientForm from "@/components/forms/PatientForm";
import HeaderBrand from "@/components/layout/HeaderBrand";

export const metadata = {
  title: "Depune o cerere | Decizia Oncologică",
  description:
    "Completează formularul pentru a depune o cerere medicală. Un specialist te va contacta în 24–48 de ore.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <HeaderBrand href="/" />
          <a
            href="/autentificare"
            className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Autentificare personal →
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-10 pb-6 text-center">
        <span className="inline-block bg-rose-100 text-rose-500 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
          Serviciu gratuit
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          Depune o cerere medicală
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto leading-relaxed">
          Completează formularul de mai jos și un specialist din echipa noastră te va contacta cu decizia medicală.
        </p>

        {/* Pași */}
        <div className="flex items-center justify-center gap-0 mt-8 text-sm">
          {[
            { nr: "1", label: "Completezi formularul" },
            { nr: "2", label: "Analizăm cererea" },
            { nr: "3", label: "Te contactăm prin email" },
          ].map((pas, i) => (
            <div key={pas.nr} className="flex items-center">
              <div className="flex flex-col items-center px-3">
                <div className="w-8 h-8 rounded-full bg-rose-400 text-white flex items-center justify-center font-bold text-sm mb-1">
                  {pas.nr}
                </div>
                <span className="text-slate-600 text-xs text-center leading-tight max-w-[80px]">{pas.label}</span>
              </div>
              {i < 2 && (
                <div className="w-10 sm:w-16 h-px bg-slate-300 mb-4" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Card formular */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">
            Date personale și descrierea cazului
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Toate datele sunt criptate și protejate conform GDPR.
          </p>
          <PatientForm />
        </div>

        {/* Footer info */}
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Date criptate SSL
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Conform GDPR
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Răspuns în 24–48h
          </span>
          <Link
            href="/echipa"
            className="flex items-center gap-1 hover:text-slate-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cunoaște echipa medicală →
          </Link>
        </div>
      </section>
    </div>
  );
}
