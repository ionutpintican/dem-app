"use client";

import { useCallback, useEffect, useState } from "react";

// Categoriile salvate de formularul public (CATEGORII_VALIDE din /api/cazuri/nou)
const ETICHETA_CATEGORIE: Record<string, string> = {
  ct: "CT",
  rmn: "RMN",
  ecografie: "Ecografie",
  radiografie: "Radiografie",
  biopsie: "Biopsie",
  analize: "Analize",
  scrisoare: "Scrisoare medicală",
  altele: "Altele",
};

export type FisierCaz = {
  id: string;
  file_name: string;
  file_size: number | null;
  category: string;
};

type Props = {
  cazId: string;
  fisiere: FisierCaz[];
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type TipFisier = "imagine" | "pdf" | "altul";

function tipFisier(nume: string): TipFisier {
  const ext = nume.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "imagine";
  if (ext === "pdf") return "pdf";
  return "altul";
}

export default function FisiereCaz({ cazId, fisiere }: Props) {
  const imagini = fisiere.filter((f) => tipFisier(f.file_name) === "imagine");

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [urlCache, setUrlCache] = useState<Record<string, string>>({});
  const [seIncarca, setSeIncarca] = useState<string | null>(null); // id fișier în curs
  const [eroare, setEroare] = useState("");

  // Cere un signed URL on-demand (fiecare cerere e logată în audit pe server)
  const cereUrl = useCallback(
    async (fileId: string, download = false): Promise<string | null> => {
      const cheie = download ? `${fileId}:dl` : fileId;
      if (urlCache[cheie]) return urlCache[cheie];

      try {
        const resp = await fetch(
          `/api/cazuri/${cazId}/fisiere/${fileId}${download ? "?download=1" : ""}`
        );
        if (!resp.ok) {
          const data = await resp.json().catch(() => null);
          throw new Error(data?.error ?? "Eroare la generarea linkului");
        }
        const { url } = (await resp.json()) as { url: string };
        setUrlCache((c) => ({ ...c, [cheie]: url }));
        return url;
      } catch (err) {
        setEroare(err instanceof Error ? err.message : "Eroare la deschiderea fișierului");
        return null;
      }
    },
    [cazId, urlCache]
  );

  async function deschideFisier(f: FisierCaz) {
    setEroare("");
    const tip = tipFisier(f.file_name);

    if (tip === "imagine") {
      const idx = imagini.findIndex((i) => i.id === f.id);
      setLightboxIndex(idx >= 0 ? idx : 0);
      return;
    }

    setSeIncarca(f.id);
    const url = await cereUrl(f.id, tip === "altul");
    setSeIncarca(null);
    if (!url) return;

    if (tip === "pdf") {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      // doc/docx — URL cu Content-Disposition: attachment
      window.location.href = url;
    }
  }

  return (
    <>
      {fisiere.length === 0 ? (
        <p className="text-sm text-slate-400">Niciun fișier atașat.</p>
      ) : (
        <ul className="space-y-2">
          {fisiere.map((f) => {
            const tip = tipFisier(f.file_name);
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => deschideFisier(f)}
                  disabled={seIncarca === f.id}
                  className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-colors group disabled:opacity-60"
                >
                  {tip === "imagine" ? (
                    <svg className="w-8 h-8 text-slate-300 group-hover:text-rose-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-slate-300 group-hover:text-rose-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 truncate">{f.file_name}</p>
                    <p className="text-xs text-slate-400">
                      {ETICHETA_CATEGORIE[f.category] ?? f.category}
                      {f.file_size ? ` · ${formatBytes(f.file_size)}` : ""}
                    </p>
                  </div>
                  {tip === "pdf" && (
                    <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 shrink-0 group-hover:text-rose-400 group-hover:border-rose-200 transition-colors">
                      PDF
                    </span>
                  )}
                  {seIncarca === f.id ? (
                    <svg className="w-4 h-4 text-rose-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : tip === "imagine" ? (
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-rose-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16zm0-11v6m-3-3h6" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-green-500 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {eroare && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{eroare}</p>
      )}

      {lightboxIndex !== null && imagini[lightboxIndex] && (
        <Lightbox
          imagini={imagini}
          index={lightboxIndex}
          cereUrl={cereUrl}
          onNavigheaza={setLightboxIndex}
          onInchide={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  imagini,
  index,
  cereUrl,
  onNavigheaza,
  onInchide,
}: {
  imagini: FisierCaz[];
  index: number;
  cereUrl: (fileId: string, download?: boolean) => Promise<string | null>;
  onNavigheaza: (index: number) => void;
  onInchide: () => void;
}) {
  const fisier = imagini[index];
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let anulat = false;
    setUrl(null);
    cereUrl(fisier.id).then((u) => {
      if (!anulat) setUrl(u);
    });
    return () => { anulat = true; };
  }, [fisier.id, cereUrl]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onInchide();
      if (e.key === "ArrowRight" && index < imagini.length - 1) onNavigheaza(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onNavigheaza(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, imagini.length, onInchide, onNavigheaza]);

  async function descarca() {
    const u = await cereUrl(fisier.id, true);
    if (u) window.location.href = u;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col"
      onClick={onInchide}
      role="dialog"
      aria-modal="true"
      aria-label={`Previzualizare ${fisier.file_name}`}
    >
      {/* Bara de sus */}
      <div
        className="flex items-center justify-between px-4 py-3 text-white shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium truncate">{fisier.file_name}</p>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-300">
            {index + 1} / {imagini.length}
          </span>
          <button
            onClick={onInchide}
            aria-label="Închide previzualizarea"
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Imaginea */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-12 relative">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL extern, dimensiune necunoscută
          <img
            src={url}
            alt={fisier.file_name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <svg className="w-8 h-8 text-white/60 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}

        {/* Săgeți navigare */}
        {index > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigheaza(index - 1); }}
            aria-label="Imaginea anterioară"
            className="absolute left-2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {index < imagini.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigheaza(index + 1); }}
            aria-label="Imaginea următoare"
            className="absolute right-2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bara de jos */}
      <div
        className="flex items-center justify-center px-4 py-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={descarca}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descarcă
        </button>
      </div>
    </div>
  );
}
