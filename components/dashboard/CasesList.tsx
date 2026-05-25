"use client";

import { useState } from "react";
import Link from "next/link";
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
  completati: number; // câți din 6 obligatorii au completat
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
            completati === TOTAL_OBLIGATORII ? "bg-green-500" : "bg-blue-400"
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

export default function CasesList({ cazuri }: { cazuri: CazPreview[] }) {
  const [cautare, setCautare] = useState("");
  const [filtruStatus, setFiltruStatus] = useState("");

  const cazuriFiltrate = cazuri.filter((c) => {
    const potrivitCautare =
      !cautare ||
      c.patient_name.toLowerCase().includes(cautare.toLowerCase()) ||
      c.patient_email.toLowerCase().includes(cautare.toLowerCase());
    const potrivitStatus = !filtruStatus || c.status === filtruStatus;
    return potrivitCautare && potrivitStatus;
  });

  return (
    <div>
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
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
          />
        </div>
        <select
          value={filtruStatus}
          onChange={(e) => setFiltruStatus(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm bg-white"
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
                      <Link
                        href={`/caz/${caz.id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Deschide →
                      </Link>
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
