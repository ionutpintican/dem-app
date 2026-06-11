"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import HeaderBrand from "@/components/layout/HeaderBrand";
import PasswordInput from "@/components/ui/PasswordInput";

// Aceleași reguli ca registerSchema / crearea de cont: min 8, o majusculă, o cifră
const PAROLA_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

type Putere = "slab" | "mediu" | "puternic";

function calculeazaPutere(p: string): Putere {
  if (!PAROLA_REGEX.test(p)) return "slab";
  if (p.length >= 12) return "puternic";
  return "mediu";
}

const CONFIG_PUTERE: Record<Putere, { bare: number; culoare: string; eticheta: string }> = {
  slab: { bare: 1, culoare: "bg-red-400", eticheta: "Slabă" },
  mediu: { bare: 2, culoare: "bg-amber-400", eticheta: "Medie" },
  puternic: { bare: 3, culoare: "bg-green-500", eticheta: "Puternică" },
};

export default function ActualizeazaParolaPage() {
  const router = useRouter();
  const [parola, setParola] = useState("");
  const [confirmare, setConfirmare] = useState("");
  const [stare, setStare] = useState<"idle" | "loading" | "success" | "eroare">("idle");
  const [eroare, setEroare] = useState("");

  const parolaNepotrivita = confirmare.length > 0 && parola !== confirmare;
  const parolaInvalida = parola.length > 0 && !PAROLA_REGEX.test(parola);
  const putere = calculeazaPutere(parola);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parola !== confirmare) {
      setEroare("Parolele nu se potrivesc.");
      return;
    }
    if (!PAROLA_REGEX.test(parola)) {
      setEroare("Parola trebuie să aibă minimum 8 caractere, o literă mare și o cifră.");
      return;
    }

    setStare("loading");
    setEroare("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: parola });

    if (error) {
      setStare("eroare");
      const mesaj = error.message.toLowerCase();
      setEroare(
        mesaj.includes("session")
          ? "Sesiunea a expirat. Solicită un nou link de resetare."
          : mesaj.includes("same") || mesaj.includes("different from the old")
          ? "Parola nouă trebuie să fie diferită de cea veche."
          : `A apărut o eroare: ${error.message}`
      );
      return;
    }

    setStare("success");
    setTimeout(() => router.push("/autentificare?resetat=1"), 2000);
  }

  if (stare === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 mb-5">
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
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <HeaderBrand href="/" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Parolă nouă</h1>
          <p className="text-slate-500 text-sm mb-8">
            Alege o parolă sigură de cel puțin 8 caractere, diferită de cea veche.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="parola" className="block text-sm font-medium text-slate-700 mb-1.5">
                Parolă nouă
              </label>
              <PasswordInput
                id="parola"
                autoComplete="new-password"
                required
                value={parola}
                onChange={(e) => setParola(e.target.value)}
                placeholder="Minimum 8 caractere, o majusculă, o cifră"
                disabled={stare === "loading"}
                className={`w-full px-4 py-2.5 rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 ${
                  parolaInvalida
                    ? "border-red-300 focus:ring-red-300"
                    : "border-slate-300 focus:ring-rose-300 focus:border-rose-400"
                }`}
              />
              {parolaInvalida && (
                <p className="mt-1 text-xs text-red-600">
                  Minimum 8 caractere, cel puțin o literă mare și o cifră.
                </p>
              )}

              {/* Indicator putere parolă */}
              {parola.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((bara) => (
                      <div
                        key={bara}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          bara <= CONFIG_PUTERE[putere].bare
                            ? CONFIG_PUTERE[putere].culoare
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Putere: <span className="font-medium">{CONFIG_PUTERE[putere].eticheta}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmare" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirmă parola
              </label>
              <PasswordInput
                id="confirmare"
                autoComplete="new-password"
                required
                value={confirmare}
                onChange={(e) => setConfirmare(e.target.value)}
                placeholder="Repetă parola"
                disabled={stare === "loading"}
                className={`w-full px-4 py-2.5 rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 ${
                  parolaNepotrivita
                    ? "border-red-300 focus:ring-red-300"
                    : "border-slate-300 focus:ring-rose-300 focus:border-rose-400"
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
              disabled={stare === "loading" || !parola || !confirmare || parolaNepotrivita || !PAROLA_REGEX.test(parola)}
              className="w-full py-2.5 bg-rose-400 text-white rounded-lg font-semibold hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
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
