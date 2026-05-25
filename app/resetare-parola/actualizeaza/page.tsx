"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ActualizeazaParolaPage() {
  const router = useRouter();
  const [parola, setParola] = useState("");
  const [confirmare, setConfirmare] = useState("");
  const [stare, setStare] = useState<"idle" | "loading" | "success" | "eroare">("idle");
  const [eroare, setEroare] = useState("");

  const parolaNepotrivita = confirmare.length > 0 && parola !== confirmare;
  const parolaScurta = parola.length > 0 && parola.length < 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parola !== confirmare) {
      setEroare("Parolele nu se potrivesc.");
      return;
    }
    if (parola.length < 8) {
      setEroare("Parola trebuie să aibă cel puțin 8 caractere.");
      return;
    }

    setStare("loading");
    setEroare("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: parola });

    if (error) {
      setStare("eroare");
      setEroare(
        error.message.includes("session")
          ? "Sesiunea a expirat. Solicită un nou link de resetare."
          : "A apărut o eroare. Încearcă din nou."
      );
      return;
    }

    setStare("success");
    setTimeout(() => router.push("/autentificare?resetat=1"), 2000);
  }

  if (stare === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-5">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Parolă actualizată!</h1>
            <p className="text-sm text-slate-500">Vei fi redirecționat la autentificare...</p>
          </div>
        </div>
      </main>
    );
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
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Parolă nouă</h1>
          <p className="text-slate-500 text-sm mb-8">
            Alege o parolă sigură de cel puțin 8 caractere.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="parola" className="block text-sm font-medium text-slate-700 mb-1.5">
                Parolă nouă
              </label>
              <input
                id="parola"
                type="password"
                autoComplete="new-password"
                required
                value={parola}
                onChange={(e) => setParola(e.target.value)}
                placeholder="Minimum 8 caractere"
                disabled={stare === "loading"}
                className={`w-full px-4 py-2.5 rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 ${
                  parolaScurta
                    ? "border-red-300 focus:ring-red-300"
                    : "border-slate-300 focus:ring-blue-300 focus:border-blue-400"
                }`}
              />
              {parolaScurta && (
                <p className="mt-1 text-xs text-red-600">Cel puțin 8 caractere.</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmare" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirmă parola
              </label>
              <input
                id="confirmare"
                type="password"
                autoComplete="new-password"
                required
                value={confirmare}
                onChange={(e) => setConfirmare(e.target.value)}
                placeholder="Repetă parola"
                disabled={stare === "loading"}
                className={`w-full px-4 py-2.5 rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 ${
                  parolaNepotrivita
                    ? "border-red-300 focus:ring-red-300"
                    : "border-slate-300 focus:ring-blue-300 focus:border-blue-400"
                }`}
              />
              {parolaNepotrivita && (
                <p className="mt-1 text-xs text-red-600">Parolele nu se potrivesc.</p>
              )}
            </div>

            {stare === "eroare" && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {eroare}
              </div>
            )}

            <button
              type="submit"
              disabled={stare === "loading" || !parola || !confirmare || parolaNepotrivita || parolaScurta}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              {stare === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Se salvează...
                </span>
              ) : (
                "Salvează parola nouă"
              )}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
