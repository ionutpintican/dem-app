"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  numeUtilizator: string;
  rolUtilizator: string;
};

export default function FeedbackModal({ numeUtilizator, rolUtilizator }: Props) {
  const [deschis, setDeschis] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [stare, setStare] = useState<"idle" | "loading" | "trimis" | "eroare">("idle");
  const [eroare, setEroare] = useState("");
  const [montat, setMontat] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setMontat(true); }, []);

  useEffect(() => {
    if (deschis && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [deschis]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") inchide();
    }
    if (deschis) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [deschis]);

  function deschideModal() {
    setDeschis(true);
    setStare("idle");
    setEroare("");
    setMesaj("");
  }

  function inchide() {
    if (stare === "loading") return;
    setDeschis(false);
  }

  async function trimite(e: React.FormEvent) {
    e.preventDefault();
    if (!mesaj.trim()) return;
    setStare("loading");
    setEroare("");

    try {
      const resp = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaj: mesaj.trim() }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error ?? "Eroare necunoscută");
      }

      setStare("trimis");
    } catch (err) {
      setStare("eroare");
      setEroare(err instanceof Error ? err.message : "Eroare la trimitere");
    }
  }

  return (
    <>
      {/* Buton trigger */}
      <button
        onClick={deschideModal}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-green-50"
        title="Sugerează îmbunătățiri echipei de dezvoltare"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="hidden sm:inline">Sugerează îmbunătățiri</span>
      </button>

      {/* Modal overlay — renderat prin portal ca să iasă de sub backdrop-filter-ul header-ului */}
      {deschis && montat && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) inchide(); }}
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "90vh" }}>

            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Sugerează îmbunătățiri echipei de dezvoltare
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mesajul va fi trimis direct dezvoltatorului aplicației
                  </p>
                </div>
              </div>
              <button
                onClick={inchide}
                disabled={stare === "loading"}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conținut */}
            {stare === "trimis" ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Mulțumim pentru feedback!</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Sugestia ta a fost trimisă cu succes echipei de dezvoltare.
                </p>
                <button
                  onClick={inchide}
                  className="px-5 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Închide
                </button>
              </div>
            ) : (
              <form onSubmit={trimite} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 px-6 pt-5 pb-4 flex flex-col gap-4 overflow-auto">

                  {/* Info expeditor */}
                  <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>
                      Trimite ca: <span className="font-medium text-slate-700">{numeUtilizator}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      {rolUtilizator}
                    </span>
                  </div>

                  {/* Textarea */}
                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Sugestia sau îmbunătățirea propusă <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      ref={textareaRef}
                      value={mesaj}
                      onChange={(e) => setMesaj(e.target.value)}
                      required
                      rows={12}
                      placeholder="Descrie ce funcționează bine, ce ar putea fi îmbunătățit, sau orice idee nouă pentru aplicație..."
                      className="flex-1 w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm resize-none leading-relaxed"
                      disabled={stare === "loading"}
                    />
                    <p className="mt-1.5 text-xs text-slate-400 text-right">
                      {mesaj.length} caractere
                    </p>
                  </div>

                  {eroare && (
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{eroare}</p>
                  )}
                </div>

                {/* Footer modal */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={inchide}
                    disabled={stare === "loading"}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    disabled={stare === "loading" || !mesaj.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {stare === "loading" ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Se trimite...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Trimite feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
