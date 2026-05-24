"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CAMPURI_PER_ROL } from "@/lib/formular-specialist";
import { ETICHETA_ROL } from "@/lib/roluri";

type Props = {
  cazId: string;
  rol: string;
  inputExistent: Record<string, string> | null;
};

export default function SpecialistInputForm({ cazId, rol, inputExistent }: Props) {
  const campuri = CAMPURI_PER_ROL[rol] ?? [];
  const router = useRouter();

  const [valori, setValori] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    campuri.forEach((c) => {
      init[c.id] = inputExistent?.[c.id] ?? "";
    });
    return init;
  });

  const [stare, setStare] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [eroare, setEroare] = useState("");
  const [editeaza, setEditeaza] = useState(!inputExistent);

  if (!campuri.length) return null;

  const etichetaRol = ETICHETA_ROL[rol] ?? rol;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStare("loading");
    setEroare("");

    try {
      const resp = await fetch(`/api/cazuri/${cazId}/input`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: valori }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error ?? "Eroare necunoscută");
      }

      setStare("success");
      setEditeaza(false);
      router.refresh();
    } catch (err) {
      setStare("error");
      setEroare(err instanceof Error ? err.message : "Eroare la trimitere");
    }
  }

  // Vizualizare read-only (după salvare sau dacă există deja)
  if (inputExistent && !editeaza) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Evaluarea mea — {etichetaRol}
          </h2>
          <button
            onClick={() => setEditeaza(true)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Editează
          </button>
        </div>

        {stare === "success" && (
          <p className="mb-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg font-medium">
            Evaluarea a fost salvată cu succes.
          </p>
        )}

        <dl className="space-y-3">
          {campuri.map((camp) => {
            const val = valori[camp.id];
            if (!val) return null;
            return (
              <div key={camp.id}>
                <dt className="text-xs text-slate-400">{camp.label}</dt>
                <dd className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap leading-relaxed">
                  {val}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          {inputExistent ? "Editează evaluarea mea" : "Adaugă evaluarea mea"} — {etichetaRol}
        </h2>
        {inputExistent && (
          <button
            type="button"
            onClick={() => { setEditeaza(false); setStare("idle"); setEroare(""); }}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Anulează
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {campuri.map((camp) => (
          <div key={camp.id}>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              {camp.label}
              {camp.obligatoriu && <span className="text-red-500 ml-1">*</span>}
            </label>
            {camp.tip === "textarea" ? (
              <textarea
                value={valori[camp.id] ?? ""}
                onChange={(e) =>
                  setValori((v) => ({ ...v, [camp.id]: e.target.value }))
                }
                placeholder={camp.placeholder}
                rows={3}
                required={camp.obligatoriu}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm resize-none"
              />
            ) : (
              <input
                type="text"
                value={valori[camp.id] ?? ""}
                onChange={(e) =>
                  setValori((v) => ({ ...v, [camp.id]: e.target.value }))
                }
                placeholder={camp.placeholder}
                required={camp.obligatoriu}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              />
            )}
          </div>
        ))}

        {eroare && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{eroare}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-400">
            Câmpurile cu <span className="text-red-500">*</span> sunt obligatorii.
          </p>
          <button
            type="submit"
            disabled={stare === "loading"}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {stare === "loading" ? "Se salvează..." : "Salvează evaluarea"}
          </button>
        </div>
      </form>
    </div>
  );
}
