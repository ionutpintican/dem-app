"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATUS_CONFIG, TOTAL_OBLIGATORII } from "@/lib/constante";

const LUNI = ["ian.", "feb.", "mar.", "apr.", "mai", "iun.", "iul.", "aug.", "sep.", "oct.", "nov.", "dec."];

function formatData(dateStr: string): string {
  const d = new Date(dateStr);
  const zi = String(d.getUTCDate()).padStart(2, "0");
  const luna = LUNI[d.getUTCMonth()];
  const an = d.getUTCFullYear();
  return `${zi} ${luna} ${an}`;
}

export type CazPreview = {
  id: string;
  patient_name: string;
  patient_email: string;
  status: string;
  created_at: string;
  completati: number;
};

function BadgeStatus({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.nou;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.culoare}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.punct}`} />
      {cfg.eticheta}
    </span>
  );
}

function BaraProgres({ completati }: { completati: number }) {
  const procent = Math.round((completati / TOTAL_OBLIGATORII) * 100);
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            completati === TOTAL_OBLIGATORII ? "bg-green-500" : "bg-rose-400"
          }`}
          style={{ width: `${procent}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 shrink-0">
        {completati}/{TOTAL_OBLIGATORII}
      </span>
    </div>
  );
}

function ModalConfirmareSterge({
  caz,
  onConfirm,
  onAnuleaza,
  loading,
  eroare,
}: {
  caz: CazPreview;
  onConfirm: () => void;
  onAnuleaza: () => void;
  loading: boolean;
  eroare: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Ștergere caz</h3>
            <p className="text-sm text-slate-500">Această acțiune nu poate fi anulată.</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg px-4 py-3 mb-5 border border-slate-200">
          <p className="text-sm font-medium text-slate-900">{caz.patient_name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{caz.patient_email}</p>
        </div>

        <p className="text-sm text-slate-600 mb-5">
          Ești sigur că vrei să ștergi definitiv acest caz? Toate datele asociate (inputuri specialiști, fișiere, concluzii) vor fi eliminate permanent.
        </p>

        {eroare && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {eroare}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onAnuleaza}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Anulează
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Se șterge...
              </>
            ) : (
              "Șterge definitiv"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CasesList({
  cazuri,
  esteAdmin = false,
}: {
  cazuri: CazPreview[];
  esteAdmin?: boolean;
}) {
  const router = useRouter();
  const [cautare, setCautare] = useState("");
  const [filtruStatus, setFiltruStatus] = useState("");
  const [cazDeSters, setCazDeSters] = useState<CazPreview | null>(null);
  const [loadingSterge, setLoadingSterge] = useState(false);
  const [eroareSterge, setEroareSterge] = useState<string | null>(null);

  const cazuriFiltrate = cazuri.filter((c) => {
    const potrivitCautare =
      !cautare ||
      c.patient_name.toLowerCase().includes(cautare.toLowerCase()) ||
      c.patient_email.toLowerCase().includes(cautare.toLowerCase());
    const potrivitStatus = !filtruStatus || c.status === filtruStatus;
    return potrivitCautare && potrivitStatus;
  });

  async function handleSterge() {
    if (!cazDeSters) return;
    setLoadingSterge(true);
    setEroareSterge(null);
    try {
      const res = await fetch(`/api/cazuri/${cazDeSters.id}`, { method: "DELETE" });
      if (res.ok) {
        setCazDeSters(null);
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setEroareSterge((body as { error?: string }).error ?? "Eroare la ștergere.");
      }
    } catch {
      setEroareSterge("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoadingSterge(false);
    }
  }

  return (
    <div>
      {cazDeSters && (
        <ModalConfirmareSterge
          caz={cazDeSters}
          onConfirm={handleSterge}
          onAnuleaza={() => { setCazDeSters(null); setEroareSterge(null); }}
          loading={loadingSterge}
          eroare={eroareSterge}
        />
      )}

      {/* Filtre */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Caută după pacient..."
            value={cautare}
            onChange={(e) => setCautare(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
          />
        </div>
        <select
          value={filtruStatus}
          onChange={(e) => setFiltruStatus(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm bg-white"
        >
          <option value="">Toate statusurile</option>
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.eticheta}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {cazuriFiltrate.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <svg className="mx-auto mb-3 w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">
              {cautare || filtruStatus
                ? "Niciun caz găsit pentru filtrele aplicate."
                : "Nu există cazuri înregistrate încă."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pacient</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Progres</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cazuriFiltrate.map((caz) => (
                  <tr key={caz.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{caz.patient_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{caz.patient_email}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                      {formatData(caz.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <BadgeStatus status={caz.status} />
                    </td>
                    <td className="px-4 py-4">
                      <BaraProgres completati={caz.completati} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/caz/${caz.id}`}
                          className="text-xs font-medium text-rose-400 hover:text-rose-500 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          Deschide →
                        </Link>
                        {esteAdmin && (
                          <button
                            onClick={() => setCazDeSters(caz)}
                            className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Șterge caz"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400 text-right">
        {cazuriFiltrate.length} din {cazuri.length} cazuri
      </p>
    </div>
  );
}
