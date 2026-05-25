"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AutentificarePage() {
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [eroare, setEroare] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const parolaResetata = searchParams.get("resetat") === "1";
  const linkExpirat = searchParams.get("eroare") === "link-expirat";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEroare("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parola,
    });

    if (error) {
      setEroare("Email sau parolă incorectă. Verifică datele și încearcă din nou.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900">DEM</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Bine ai revenit</h1>
          <p className="text-slate-500 text-sm mb-1">
            Autentificare personal medical și administrativ
          </p>
          <p className="text-slate-400 text-xs mb-8">
            Autentifică-te cu datele primite de la administrator.
          </p>

          {parolaResetata && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 mb-5">
              Parola a fost resetată cu succes. Te poți autentifica cu parola nouă.
            </div>
          )}

          {linkExpirat && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 mb-5">
              Link-ul de resetare a expirat sau este invalid.{" "}
              <Link href="/resetare-parola" className="font-medium underline hover:no-underline">
                Solicită unul nou.
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Adresă de email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@spital.ro"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="parola" className="block text-sm font-medium text-slate-700">
                  Parolă
                </label>
                <Link
                  href="/resetare-parola"
                  className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Ai uitat parola?
                </Link>
              </div>
              <input
                id="parola"
                type="password"
                autoComplete="current-password"
                required
                value={parola}
                onChange={(e) => setParola(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
              />
            </div>

            {eroare && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {eroare}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !parola}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Se verifică...
                </span>
              ) : (
                "Intră în cont"
              )}
            </button>
          </form>
        </div>

        {/* Info cont */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Nu ai cont?{" "}
          <span className="text-slate-700 font-medium">
            Contactează administratorul sistemului.
          </span>
        </p>

        <div className="mt-5">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-50 px-3 text-xs text-slate-400 uppercase tracking-wide">
                Pentru pacienți
              </span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 hover:border-blue-300 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Depune o cerere medicală
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
