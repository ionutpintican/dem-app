"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLURI_MEDICALE, ETICHETA_ROL } from "@/lib/roluri";
import HeaderBrand from "@/components/layout/HeaderBrand";

const supabase = createClient();

type ProfilDate = {
  full_name: string | null;
  email: string;
  role: string;
};

export default function ProfilPage() {

  const [profil, setProfil] = useState<ProfilDate | null>(null);
  const [incarcare, setIncarcare] = useState(true);

  // Specializare
  const [rolNou, setRolNou] = useState("");
  const [stareRol, setStareRol] = useState<"idle" | "loading" | "succes" | "eroare">("idle");
  const [eroareRol, setEroareRol] = useState("");

  // Parolă
  const [parolaVeche, setParolaVeche] = useState("");
  const [parolaNoua, setParolaNoua] = useState("");
  const [confirmaParola, setConfirmaParola] = useState("");
  const [stareParola, setStareParola] = useState<"idle" | "loading" | "succes" | "eroare">("idle");
  const [eroareParola, setEroareParola] = useState("");

  useEffect(() => {
    async function incarcaProfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .single() as unknown as { data: { full_name: string | null; role: string } | null; error: unknown };

      if (data) {
        setProfil({ full_name: data.full_name, email: user.email ?? "", role: data.role });
        setRolNou(data.role);
      }
      setIncarcare(false);
    }
    incarcaProfil();
  }, []);

  async function handleSchimbaRol(e: React.FormEvent) {
    e.preventDefault();
    if (rolNou === profil?.role) return;
    setStareRol("loading");
    setEroareRol("");

    const res = await fetch("/api/profil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol: rolNou }),
    });
    const json = await res.json();

    if (!res.ok) {
      setStareRol("eroare");
      setEroareRol(json.error ?? "A apărut o eroare.");
      return;
    }

    setProfil((prev) => prev ? { ...prev, role: rolNou } : prev);
    setStareRol("succes");
    setTimeout(() => setStareRol("idle"), 3000);
  }

  async function handleSchimbaParola(e: React.FormEvent) {
    e.preventDefault();
    setStareParola("loading");
    setEroareParola("");

    if (parolaNoua.length < 8) {
      setStareParola("eroare");
      setEroareParola("Parola nouă trebuie să aibă minim 8 caractere.");
      return;
    }
    if (parolaNoua !== confirmaParola) {
      setStareParola("eroare");
      setEroareParola("Parola nouă și confirmarea nu coincid.");
      return;
    }
    if (parolaVeche === parolaNoua) {
      setStareParola("eroare");
      setEroareParola("Parola nouă trebuie să fie diferită de cea veche.");
      return;
    }

    // Verificare parolă veche
    const { error: eroareVerif } = await supabase.auth.signInWithPassword({
      email: profil?.email ?? "",
      password: parolaVeche,
    });
    if (eroareVerif) {
      setStareParola("eroare");
      setEroareParola("Parola veche este incorectă.");
      return;
    }

    // Actualizare parolă
    const { error: eroareUpdate } = await supabase.auth.updateUser({ password: parolaNoua });
    if (eroareUpdate) {
      setStareParola("eroare");
      setEroareParola(eroareUpdate.message);
      return;
    }

    setParolaVeche("");
    setParolaNoua("");
    setConfirmaParola("");
    setStareParola("succes");
    setTimeout(() => setStareParola("idle"), 3000);
  }

  const esteAdmin = profil?.role === "admin";

  if (incarcare) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <HeaderBrand href="/dashboard" />
            <button
              onClick={() => { window.location.href = "/dashboard"; }}
              className="text-sm text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ← Dashboard
            </button>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-slate-900">{profil?.full_name ?? profil?.email}</span>
            <span className="text-xs text-slate-500">{ETICHETA_ROL[profil?.role ?? ""] ?? profil?.role}</span>
          </div>
        </div>
      </header>

      {/* Conținut */}
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profilul meu</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {profil?.email}
          </p>
        </div>

        {/* Secțiune Specializare */}
        {!esteAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Specializare medicală</h2>
                <p className="text-xs text-slate-500">Modifică specializarea ta din sistem</p>
              </div>
            </div>

            <form onSubmit={handleSchimbaRol} className="space-y-4">
              <div>
                <label htmlFor="specializare" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Specializare
                </label>
                <select
                  id="specializare"
                  value={rolNou}
                  onChange={(e) => { setRolNou(e.target.value); setStareRol("idle"); }}
                  disabled={stareRol === "loading"}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-colors disabled:opacity-60"
                >
                  {ROLURI_MEDICALE.map((r) => (
                    <option key={r.valoare} value={r.valoare}>{r.eticheta}</option>
                  ))}
                </select>
              </div>

              {stareRol === "eroare" && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {eroareRol}
                </div>
              )}
              {stareRol === "succes" && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  Specializarea a fost actualizată cu succes.
                </div>
              )}

              <button
                type="submit"
                disabled={stareRol === "loading" || rolNou === profil?.role}
                className="px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              >
                {stareRol === "loading" ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Se salvează...
                  </span>
                ) : "Salvează specializarea"}
              </button>
            </form>
          </div>
        )}

        {/* Secțiune Parolă */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Schimbare parolă</h2>
              <p className="text-xs text-slate-500">Introdu parola curentă pentru a seta una nouă</p>
            </div>
          </div>

          <form onSubmit={handleSchimbaParola} className="space-y-4">
            <div>
              <label htmlFor="parola-veche" className="block text-sm font-medium text-slate-700 mb-1.5">
                Parola curentă
              </label>
              <input
                id="parola-veche"
                type="password"
                autoComplete="current-password"
                required
                value={parolaVeche}
                onChange={(e) => { setParolaVeche(e.target.value); setStareParola("idle"); }}
                disabled={stareParola === "loading"}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-colors disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="parola-noua" className="block text-sm font-medium text-slate-700 mb-1.5">
                Parola nouă
              </label>
              <input
                id="parola-noua"
                type="password"
                autoComplete="new-password"
                required
                value={parolaNoua}
                onChange={(e) => { setParolaNoua(e.target.value); setStareParola("idle"); }}
                disabled={stareParola === "loading"}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-colors disabled:opacity-60"
                placeholder="Minim 8 caractere"
              />
            </div>

            <div>
              <label htmlFor="confirma-parola" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirmă parola nouă
              </label>
              <input
                id="confirma-parola"
                type="password"
                autoComplete="new-password"
                required
                value={confirmaParola}
                onChange={(e) => { setConfirmaParola(e.target.value); setStareParola("idle"); }}
                disabled={stareParola === "loading"}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-colors disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>

            {stareParola === "eroare" && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {eroareParola}
              </div>
            )}
            {stareParola === "succes" && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Parola a fost schimbată cu succes.
              </div>
            )}

            <button
              type="submit"
              disabled={stareParola === "loading" || !parolaVeche || !parolaNoua || !confirmaParola}
              className="px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            >
              {stareParola === "loading" ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Se salvează...
                </span>
              ) : "Schimbă parola"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
