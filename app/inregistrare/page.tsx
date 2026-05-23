import Link from "next/link";

// Medicii nu se pot înregistra singuri.
// Conturile sunt create exclusiv de administrator.
export default function InregistrarePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-6">
          <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Acces restricționat</h1>
        <p className="text-slate-600 leading-relaxed mb-8">
          Conturile pentru platforma DEM sunt create exclusiv de administrator.
          Dacă ești medic sau specialist și nu ai primit credențialele,
          contactează administratorul sistemului.
        </p>
        <Link
          href="/autentificare"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Înapoi la autentificare
        </Link>
      </div>
    </main>
  );
}
