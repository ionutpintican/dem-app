import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-5xl font-bold text-slate-900">dem-app</h1>
        <p className="text-xl text-slate-600 max-w-md">
          Aplicație modernă construită cu Next.js 14, Supabase și Tailwind CSS.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/autentificare"
            className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
          >
            Autentificare
          </Link>
          <Link
            href="/inregistrare"
            className="px-6 py-3 border border-slate-900 text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors"
          >
            Înregistrare
          </Link>
        </div>
      </div>
    </main>
  );
}
