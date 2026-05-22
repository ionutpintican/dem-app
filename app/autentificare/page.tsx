import Link from "next/link";

export default function AutentificarePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Autentificare</h1>
        <p className="text-slate-500 mb-6">Intră în contul tău.</p>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="email@exemplu.ro"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Parolă
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
          >
            Intră în cont
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Nu ai cont?{" "}
          <Link href="/inregistrare" className="text-slate-900 font-medium hover:underline">
            Înregistrează-te
          </Link>
        </p>
      </div>
    </main>
  );
}
