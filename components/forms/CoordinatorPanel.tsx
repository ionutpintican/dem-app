"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ETICHETA_ROL } from "@/lib/roluri";

type Props = {
  cazId: string;
  cazStatus: string;
  patientEmail: string;
  concluzieExistenta: { decizie_finala?: string; recomandari?: string } | null;
  roluriLipsa: string[]; // roluri obligatorii care nu au completat încă
};

export default function CoordinatorPanel({
  cazId,
  cazStatus,
  patientEmail,
  concluzieExistenta,
  roluriLipsa,
}: Props) {
  const router = useRouter();

  const [decizie, setDecizie] = useState(concluzieExistenta?.decizie_finala ?? "");
  const [recomandari, setRecomandari] = useState(concluzieExistenta?.recomandari ?? "");

  const [stareFormular, setStareFormular] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [eroareFormular, setEroareFormular] = useState("");
  const [editeaza, setEditeaza] = useState(!concluzieExistenta);

  const [stareTriimitere, setStareTriimitere] = useState<"idle" | "confirmare" | "loading" | "trimis" | "error">("idle");
  const [eroareTriimitere, setEroareTriimitere] = useState("");

  const [stareRedeschidere, setStareRedeschidere] = useState<"idle" | "confirmare" | "loading" | "error">("idle");
  const [eroareRedeschidere, setEroareRedeschidere] = useState("");

  const esteFinalizat = cazStatus === "trimis" || cazStatus === "arhivat";
  const areConcluzieCompletata = decizie.trim().length > 0;
  const toateLipsa = roluriLipsa.length > 0;

  // ─── Salvare concluzie ──────────────────────────────────────────────────────
  async function salveazaConcluzia(e: React.FormEvent) {
    e.preventDefault();
    if (!decizie.trim()) return;

    setStareFormular("loading");
    setEroareFormular("");

    try {
      const resp = await fetch(`/api/cazuri/${cazId}/concluzie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: {
            decizie_finala: decizie.trim(),
            ...(recomandari.trim() && { recomandari: recomandari.trim() }),
          },
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error ?? "Eroare necunoscută");
      }

      setStareFormular("success");
      setEditeaza(false);
      router.refresh();
    } catch (err) {
      setStareFormular("error");
      setEroareFormular(err instanceof Error ? err.message : "Eroare la salvare");
    }
  }

  // ─── Redeschidere fișă ──────────────────────────────────────────────────────
  async function redeschideFisa() {
    setStareRedeschidere("loading");
    setEroareRedeschidere("");

    try {
      const resp = await fetch(`/api/cazuri/${cazId}/redeschide`, { method: "POST" });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error ?? "Eroare necunoscută");
      }
      router.refresh();
    } catch (err) {
      setStareRedeschidere("error");
      setEroareRedeschidere(err instanceof Error ? err.message : "Eroare la redeschidere");
    }
  }

  // ─── Trimitere email ────────────────────────────────────────────────────────
  async function trimiteDecizia() {
    setStareTriimitere("loading");
    setEroareTriimitere("");

    try {
      const resp = await fetch(`/api/cazuri/${cazId}/trimite-decizia`, {
        method: "POST",
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error ?? "Eroare necunoscută");
      }

      setStareTriimitere("trimis");
      router.refresh();
    } catch (err) {
      setStareTriimitere("error");
      setEroareTriimitere(err instanceof Error ? err.message : "Eroare la trimitere");
    }
  }

  // ─── Starea "deja trimis" ───────────────────────────────────────────────────
  if (cazStatus === "trimis") {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Decizia a fost trimisă pacientului</p>
            <p className="text-xs text-green-600 mt-0.5">Email trimis la {patientEmail}</p>
          </div>
        </div>

        {concluzieExistenta?.decizie_finala && (
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <p className="text-xs text-slate-400 mb-1">Decizia finală</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {concluzieExistenta.decizie_finala}
            </p>
            {concluzieExistenta.recomandari && (
              <>
                <p className="text-xs text-slate-400 mt-3 mb-1">Recomandări</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {concluzieExistenta.recomandari}
                </p>
              </>
            )}
          </div>
        )}

        {/* Redeschidere fișă */}
        {eroareRedeschidere && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{eroareRedeschidere}</p>
        )}

        {stareRedeschidere === "confirmare" ? (
          <div className="bg-white rounded-lg border border-amber-200 p-4 space-y-3">
            <p className="text-sm text-slate-700">
              Redeschiderea fișei permite medicilor să editeze evaluările și coordonatorului să
              trimită din nou decizia. Ești sigur?
            </p>
            <div className="flex gap-2">
              <button
                onClick={redeschideFisa}
                className="flex-1 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                Da, redeschide fișa
              </button>
              <button
                onClick={() => setStareRedeschidere("idle")}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Anulează
              </button>
            </div>
          </div>
        ) : stareRedeschidere === "loading" ? (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-amber-200 text-amber-600 text-sm">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Se redeschide...
          </div>
        ) : (
          <button
            onClick={() => setStareRedeschidere("confirmare")}
            disabled={stareRedeschidere === "loading"}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 text-amber-700 text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {stareRedeschidere === "loading" ? "Se redeschide..." : "Redeschide fișa pentru modificări"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
      {/* Header panou */}
      <div className="bg-amber-50 border-b border-amber-200 px-5 py-3.5 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
          Panou Coordonator
        </h2>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Secțiunea 1: Concluzie finală ── */}
        {!editeaza && concluzieExistenta ? (
          // Read-only
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Concluzie finală
              </p>
              {!esteFinalizat && (
                <button
                  onClick={() => { setEditeaza(true); setStareFormular("idle"); }}
                  className="text-xs font-medium text-amber-700 hover:text-amber-800 px-2.5 py-1 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  Editează
                </button>
              )}
            </div>
            {stareFormular === "success" && (
              <p className="mb-2 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg font-medium">
                Concluzia a fost salvată.
              </p>
            )}
            <div className="bg-amber-50 rounded-lg border border-amber-100 p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Decizia echipei</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {concluzieExistenta.decizie_finala}
                </p>
              </div>
              {concluzieExistenta.recomandari && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Recomandări</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {concluzieExistenta.recomandari}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : !esteFinalizat ? (
          // Formular editare / completare
          <form onSubmit={salveazaConcluzia} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {concluzieExistenta ? "Editează concluzia finală" : "Adaugă concluzia finală"}
              </p>
              {concluzieExistenta && (
                <button
                  type="button"
                  onClick={() => { setEditeaza(false); setStareFormular("idle"); setEroareFormular(""); }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Anulează
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Decizia echipei <span className="text-red-500">*</span>
              </label>
              <textarea
                value={decizie}
                onChange={(e) => setDecizie(e.target.value)}
                rows={5}
                required
                placeholder="Scrieți decizia colectivă a echipei multidisciplinare — diagnosticul confirmat, planul de tratament ales și motivarea acestuia..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Recomandări suplimentare <span className="text-slate-400 font-normal">(opțional)</span>
              </label>
              <textarea
                value={recomandari}
                onChange={(e) => setRecomandari(e.target.value)}
                rows={3}
                placeholder="Investigații suplimentare, controale periodice, stil de viață, alte instrucțiuni pentru pacient..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm resize-none"
              />
            </div>

            {eroareFormular && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{eroareFormular}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={stareFormular === "loading" || !decizie.trim()}
                className="px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {stareFormular === "loading" ? "Se salvează..." : "Salvează concluzia"}
              </button>
            </div>
          </form>
        ) : null}

        {/* ── Secțiunea 2: Trimitere email ── */}
        {!esteFinalizat && (
          <div className={`rounded-lg border p-4 ${
            areConcluzieCompletata
              ? toateLipsa
                ? "border-orange-200 bg-orange-50"
                : "border-blue-200 bg-blue-50"
              : "border-slate-200 bg-slate-50"
          }`}>

            {/* Info: toți au completat */}
            {!toateLipsa && areConcluzieCompletata && (
              <div className="mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs text-blue-700 font-medium">
                  Toți specialiștii obligatorii au completat evaluarea.
                </p>
              </div>
            )}

            {/* Avertisment: lipsesc specialiști */}
            {toateLipsa && areConcluzieCompletata && (
              <div className="mb-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-orange-700">
                  <span className="font-semibold">Evaluări lipsă: </span>
                  {roluriLipsa.map((r) => ETICHETA_ROL[r] ?? r).join(", ")}
                </p>
              </div>
            )}

            {/* Concluzie lipsă */}
            {!areConcluzieCompletata && (
              <div className="mb-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-slate-500">
                  Completează concluzia finală pentru a putea trimite decizia.
                </p>
              </div>
            )}

            {/* Destinatar */}
            <p className="text-xs text-slate-500 mb-3">
              <span className="font-medium text-slate-600">Destinatar: </span>
              {patientEmail}
            </p>

            {/* Eroare trimitere */}
            {stareTriimitere === "error" && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">
                {eroareTriimitere}
              </p>
            )}

            {/* Popup confirmare */}
            {(stareTriimitere === "confirmare" || stareTriimitere === "loading") ? (
              <div className={`bg-white rounded-lg border p-4 space-y-3 ${
                toateLipsa ? "border-orange-300" : "border-blue-200"
              }`}>
                {toateLipsa ? (
                  // Confirmare cu avertisment — lipsesc specialiști
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm font-semibold text-orange-800">Atenție — evaluări incomplete</p>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      Următorii specialiști <span className="font-medium text-slate-800">nu au completat</span> evaluarea:
                    </p>
                    <ul className="mb-3 space-y-0.5">
                      {roluriLipsa.map((r) => (
                        <li key={r} className="text-sm text-orange-700 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                          {ETICHETA_ROL[r] ?? r}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-slate-700">
                      Ești sigur că vrei să trimiți decizia <span className="font-semibold">acum</span>?{" "}
                      <span className="text-slate-500">Această acțiune nu poate fi anulată.</span>
                    </p>
                  </div>
                ) : (
                  // Confirmare normală — toți au completat
                  <p className="text-sm text-slate-700">
                    Ești sigur că vrei să trimiți decizia finală la{" "}
                    <span className="font-medium text-slate-900">{patientEmail}</span>?{" "}
                    <span className="text-slate-500">Această acțiune nu poate fi anulată.</span>
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={trimiteDecizia}
                    disabled={stareTriimitere === "loading"}
                    className={`flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      toateLipsa
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {stareTriimitere === "loading" ? "Se trimite..." : "Da, trimite decizia"}
                  </button>
                  <button
                    onClick={() => setStareTriimitere("idle")}
                    disabled={stareTriimitere === "loading"}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    Anulează
                  </button>
                </div>
              </div>
            ) : (
              // Buton principal — activ ori de câte ori există concluzie
              <button
                onClick={() => areConcluzieCompletata && setStareTriimitere("confirmare")}
                disabled={!areConcluzieCompletata}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-colors ${
                  areConcluzieCompletata
                    ? toateLipsa
                      ? "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                      : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Trimite decizia pacientului
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
