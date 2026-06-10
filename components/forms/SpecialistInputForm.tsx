"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CAMPURI_PER_ROL } from "@/lib/formular-specialist";
import { ETICHETA_ROL } from "@/lib/roluri";
import { useUnsavedGuard } from "@/lib/hooks/use-unsaved-guard";

type Props = {
  cazId: string;
  rol: string;
  cazStatus: string;
  inputExistent: Record<string, string> | null;
  inputUpdatedAt: string | null;
};

export default function SpecialistInputForm({
  cazId,
  rol,
  cazStatus,
  inputExistent,
  inputUpdatedAt,
}: Props) {
  const campuri = CAMPURI_PER_ROL[rol] ?? [];
  const router = useRouter();

  // Valorile de pornire derivate din server (baseline pentru detectarea modificărilor)
  const baseline = useMemo(() => {
    const init: Record<string, string> = {};
    campuri.forEach((c) => {
      init[c.id] = inputExistent?.[c.id] ?? "";
    });
    return init;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputExistent, rol]);

  const [valori, setValori] = useState<Record<string, string>>(baseline);

  const [stare, setStare] = useState<"idle" | "loading" | "success" | "error" | "conflict">("idle");
  const [eroare, setEroare] = useState("");
  const [editeaza, setEditeaza] = useState(!inputExistent);
  const esteFinalizat = cazStatus === "trimis" || cazStatus === "arhivat";

  // Resincronizare cu serverul (după router.refresh sau anulare) cât timp nu editezi
  useEffect(() => {
    if (!editeaza) setValori(baseline);
  }, [baseline, editeaza]);

  // Prompt nativ la închiderea tabului dacă există modificări nesalvate
  const areModificari = editeaza && JSON.stringify(valori) !== JSON.stringify(baseline);
  useUnsavedGuard(areModificari);

  if (!campuri.length) return null;

  const etichetaRol = ETICHETA_ROL[rol] ?? rol;

  async function trimite(forteaza: boolean) {
    setStare("loading");
    setEroare("");

    try {
      const resp = await fetch(`/api/cazuri/${cazId}/input`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: valori,
          // null = suprascrie indiferent de versiune; string = doar dacă versiunea coincide
          expected_updated_at: forteaza ? null : inputUpdatedAt,
        }),
      });

      if (resp.status === 409) {
        setStare("conflict");
        return;
      }

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    trimite(false);
  }

  // Vizualizare read-only (după salvare sau dacă există deja)
  if (inputExistent && !editeaza) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-rose-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Evaluarea mea — {etichetaRol}
          </h2>
          {!esteFinalizat && (
            <button
              onClick={() => setEditeaza(true)}
              className="text-xs font-medium text-rose-400 hover:text-rose-500 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Editează
            </button>
          )}
        </div>
        {esteFinalizat && (
          <p className="text-xs text-slate-400 italic mb-3">
            Fișa a fost trimisă pacientului. Coordonatorul poate redeschide fișa pentru modificări.
          </p>
        )}

        {stare === "success" && (
          <p className="mb-3 text-xs text-rose-400 bg-rose-50 px-3 py-2 rounded-lg font-medium">
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
    <div className="bg-white rounded-xl shadow-sm border border-rose-200 p-5">
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
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm resize-none"
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
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
              />
            )}
          </div>
        ))}

        {eroare && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{eroare}</p>
        )}

        {stare === "conflict" && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-semibold text-amber-800">Modificare detectată</p>
            <p className="text-xs text-amber-700 mt-1">
              Evaluarea a fost actualizată între timp (în alt tab sau pe alt dispozitiv).
              Poți reîncărca versiunea curentă — pierzi modificările de aici — sau o poți
              suprascrie cu ce ai completat acum.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => { setEditeaza(false); setStare("idle"); router.refresh(); }}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-medium rounded-lg hover:bg-amber-100 transition-colors"
              >
                Reîncarcă versiunea curentă
              </button>
              <button
                type="button"
                onClick={() => trimite(true)}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                Suprascrie
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-400">
            Câmpurile cu <span className="text-red-500">*</span> sunt obligatorii.
          </p>
          <button
            type="submit"
            disabled={stare === "loading"}
            className="px-5 py-2.5 bg-rose-400 text-white text-sm font-medium rounded-lg hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {stare === "loading" ? "Se salvează..." : "Salvează evaluarea"}
          </button>
        </div>
      </form>
    </div>
  );
}
