"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetareParolaPage() {
  const [email, setEmail] = useState("");
  const [stare, setStare] = useState<"idle" | "loading" | "trimis" | "eroare">("idle");
  const [eroare, setEroare] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStare("loading");
    setEroare("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/resetare-parola/actualizeaza`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      setStare("eroare");
      setEroare(`A apărut o eroare: ${error.message}`);
      console.error("Eroare resetPasswordForEmail:", error);
      return;
    }

    setStare("trimis");
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          {stare === "trimis" ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-5">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Email trimis!</h1>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Dacă adresa <span className="font-medium text-slate-700">{email}</span> există
                în sistem, vei primi un link de resetare în câteva minute.
              </p>
              <p className="text-xs text-slate-400 mb-6">
                Verifică și folderul Spam dacă nu găsești emailul.
              </p>
              <Link
                href="/autentificare"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                ← Înapoi la autentificare
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Resetare parolă</h1>
              <p className="text-slate-500 text-sm mb-8">
                Introdu adresa de email și îți trimitem un link de resetare.
              </p>

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
                    disabled={stare === "loading"}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors disabled:opacity-60"
                  />
                </div>

                {stare === "eroare" && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {eroare}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={stare === "loading" || !email.trim()}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  {stare === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Se trimite...
                    </span>
                  ) : (
                    "Trimite link de resetare"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {stare !== "trimis" && (
          <p className="text-center text-sm text-slate-500 mt-6">
            <Link href="/autentificare" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              ← Înapoi la autentificare
            </Link>
          </p>
        )}

      </div>
    </main>
  );
}
