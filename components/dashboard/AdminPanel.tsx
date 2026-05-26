"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ROLURI_MEDICALE, ETICHETA_ROL, CULORI_ROL } from "@/lib/roluri";
import type { Utilizator } from "@/app/api/admin/users/route";

// ─── Generare parolă temporară ────────────────────────────────────────────────
function genereazaParola(): string {
  const seturi = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnpqrstuvwxyz",
    "23456789",
    "!@#$%",
  ];
  let parola = seturi.map((s) => s[Math.floor(Math.random() * s.length)]).join("");
  const toate = seturi.join("");
  for (let i = parola.length; i < 12; i++) {
    parola += toate[Math.floor(Math.random() * toate.length)];
  }
  return parola.split("").sort(() => Math.random() - 0.5).join("");
}

// ─── Badge rol ────────────────────────────────────────────────────────────────
function BadgeRol({ rol }: { rol: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CULORI_ROL[rol] ?? "bg-slate-100 text-slate-600"}`}>
      {ETICHETA_ROL[rol] ?? rol}
    </span>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({
  activ,
  onToggle,
  disabled,
}: {
  activ: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${
        activ ? "bg-rose-400" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          activ ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Modal creare cont nou ────────────────────────────────────────────────────
function ModalContNou({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (u: Utilizator) => void;
}) {
  const [campuri, setCampuri] = useState({
    full_name: "",
    email: "",
    role: "",
    parola_temporara: genereazaParola(),
  });
  const [eroare, setEroare] = useState("");
  const [parolaCopiata, setParolaCopiata] = useState(false);
  const [pending, startTransition] = useTransition();

  function schimba(camp: string, val: string) {
    setCampuri((prev) => ({ ...prev, [camp]: val }));
    setEroare("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!campuri.full_name || !campuri.email || !campuri.role) {
      setEroare("Completează toate câmpurile obligatorii.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campuri),
      });
      const data = await res.json();
      if (!res.ok) {
        setEroare(data.error ?? "Eroare la crearea contului.");
        return;
      }
      onSuccess({
        id: data.userId,
        full_name: campuri.full_name,
        email: campuri.email,
        role: campuri.role,
        is_coordinator: false,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    });
  }

  function copiazaParola() {
    navigator.clipboard.writeText(campuri.parola_temporara);
    setParolaCopiata(true);
    setTimeout(() => setParolaCopiata(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Cont nou</h2>
        <p className="text-sm text-slate-500 mb-6">
          Completează datele — doctorul va primi credențialele pe email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Nume complet */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nume complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={campuri.full_name}
              onChange={(e) => schimba("full_name", e.target.value)}
              placeholder="Dr. Ion Popescu"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={campuri.email}
              onChange={(e) => schimba("email", e.target.value)}
              placeholder="doctor@spital.ro"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rol medical <span className="text-red-500">*</span>
            </label>
            <select
              value={campuri.role}
              onChange={(e) => schimba("role", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors bg-white"
            >
              <option value="">— Selectează rolul —</option>
              {ROLURI_MEDICALE.map((r) => (
                <option key={r.valoare} value={r.valoare}>
                  {r.eticheta}
                </option>
              ))}
            </select>
          </div>

          {/* Parolă temporară */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Parolă temporară
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={campuri.parola_temporara}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-mono text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={copiazaParola}
                className="px-3 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600"
                title="Copiază parola"
              >
                {parolaCopiata ? "✓" : "Copiază"}
              </button>
              <button
                type="button"
                onClick={() => schimba("parola_temporara", genereazaParola())}
                className="px-3 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors text-sm text-slate-600"
                title="Generează altă parolă"
              >
                ↻
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Salvează această parolă — o vei transmite doctorului separat.
            </p>
          </div>

          {eroare && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {eroare}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-2.5 rounded-lg bg-rose-400 text-white font-semibold hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? "Se creează..." : "Creează contul"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal editare cont ───────────────────────────────────────────────────────
function ModalEditareCont({
  utilizator,
  onClose,
  onSuccess,
}: {
  utilizator: Utilizator;
  onClose: () => void;
  onSuccess: (u: Partial<Utilizator>) => void;
}) {
  const [campuri, setCampuri] = useState({
    full_name: utilizator.full_name ?? "",
    email: utilizator.email,
    role: utilizator.role,
  });
  const [eroare, setEroare] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!campuri.full_name || !campuri.email || !campuri.role) {
      setEroare("Completează toate câmpurile.");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${utilizator.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campuri),
      });
      const data = await res.json();
      if (!res.ok) {
        setEroare(data.error ?? "Eroare la salvare.");
        return;
      }
      onSuccess(campuri);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Editare cont</h2>
        <p className="text-sm text-slate-500 mb-6">{utilizator.email}</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nume complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={campuri.full_name}
              onChange={(e) => setCampuri((p) => ({ ...p, full_name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={campuri.email}
              onChange={(e) => setCampuri((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rol medical <span className="text-red-500">*</span>
            </label>
            <select
              value={campuri.role}
              onChange={(e) => setCampuri((p) => ({ ...p, role: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors bg-white"
            >
              {ROLURI_MEDICALE.map((r) => (
                <option key={r.valoare} value={r.valoare}>
                  {r.eticheta}
                </option>
              ))}
            </select>
          </div>

          {eroare && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {eroare}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-2.5 rounded-lg bg-rose-400 text-white font-semibold hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? "Se salvează..." : "Salvează"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal confirmare ștergere cont ──────────────────────────────────────────
function ModalStergeCont({
  utilizator,
  onClose,
  onSuccess,
}: {
  utilizator: Utilizator;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [eroare, setEroare] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSterge() {
    setEroare("");
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${utilizator.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setEroare(data.error ?? "Eroare la ștergerea contului.");
        return;
      }
      onSuccess();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Șterge cont</h2>
            <p className="text-sm text-slate-500">{utilizator.full_name ?? utilizator.email}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-3">
          Doctorul nu va mai putea accesa aplicația. Contribuțiile medicale și concluziile sale din cazurile existente
          vor rămâne în sistem.
        </p>
        <p className="text-xs text-slate-400 mb-6">Această acțiune nu poate fi anulată.</p>

        {eroare && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
            {eroare}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={handleSterge}
            disabled={pending}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? "Se șterge..." : "Șterge contul"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componenta principală AdminPanel ─────────────────────────────────────────
export default function AdminPanel({
  utilizatoriInitiali,
}: {
  utilizatoriInitiali: Utilizator[];
}) {
  const router = useRouter();
  const [utilizatori, setUtilizatori] = useState<Utilizator[]>(utilizatoriInitiali);
  const [afiseazaModalNou, setAfiseazaModalNou] = useState(false);
  const [utilizatorDeEditat, setUtilizatorDeEditat] = useState<Utilizator | null>(null);
  const [utilizatorDesters, setUtilizatorDesters] = useState<Utilizator | null>(null);
  const [eroareToggle, setEroareToggle] = useState<string>("");
  const [cautare, setCautare] = useState("");
  const [filtruRol, setFiltruRol] = useState("");
  const [pending, startTransition] = useTransition();

  // Filtrare locală
  const utilizatoriFiltrati = utilizatori.filter((u) => {
    const termCautare = cautare.toLowerCase();
    const potriviteCautare =
      !termCautare ||
      (u.full_name ?? "").toLowerCase().includes(termCautare) ||
      u.email.toLowerCase().includes(termCautare);
    const potrivitRol = !filtruRol || u.role === filtruRol;
    return potriviteCautare && potrivitRol;
  });

  // Statistici
  const totalActivi = utilizatori.filter((u) => u.is_active).length;
  const totalCoordinator = utilizatori.filter((u) => u.is_coordinator && u.is_active).length;

  // Toggle is_active / is_coordinator
  async function toggle(id: string, camp: "is_active" | "is_coordinator", valNouă: boolean) {
    setEroareToggle("");
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [camp]: valNouă }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEroareToggle(data.error ?? "Eroare la actualizare.");
        return;
      }
      setUtilizatori((prev) =>
        prev.map((u) => (u.id === id ? { ...u, [camp]: valNouă } : u))
      );
      router.refresh();
    });
  }

  function laContNouCriat(u: Utilizator) {
    setUtilizatori((prev) => [u, ...prev]);
    setAfiseazaModalNou(false);
    router.refresh();
  }

  function laContEditat(id: string, schimbari: Partial<Utilizator>) {
    setUtilizatori((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...schimbari } : u))
    );
    setUtilizatorDeEditat(null);
    router.refresh();
  }

  function laContSters(id: string) {
    setUtilizatori((prev) => prev.filter((u) => u.id !== id));
    setUtilizatorDesters(null);
    router.refresh();
  }

  return (
    <>
      {/* Modals */}
      {afiseazaModalNou && (
        <ModalContNou
          onClose={() => setAfiseazaModalNou(false)}
          onSuccess={laContNouCriat}
        />
      )}
      {utilizatorDeEditat && (
        <ModalEditareCont
          utilizator={utilizatorDeEditat}
          onClose={() => setUtilizatorDeEditat(null)}
          onSuccess={(schimbari) => laContEditat(utilizatorDeEditat.id, schimbari)}
        />
      )}
      {utilizatorDesters && (
        <ModalStergeCont
          utilizator={utilizatorDesters}
          onClose={() => setUtilizatorDesters(null)}
          onSuccess={() => laContSters(utilizatorDesters.id)}
        />
      )}

      {/* Statistici */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { eticheta: "Total conturi", valoare: utilizatori.length, culoare: "text-slate-900" },
          { eticheta: "Conturi active", valoare: totalActivi, culoare: "text-green-600" },
          { eticheta: "Coordonatori activi", valoare: totalCoordinator, culoare: "text-amber-600" },
        ].map((s) => (
          <div key={s.eticheta} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">{s.eticheta}</p>
            <p className={`text-3xl font-bold ${s.culoare}`}>{s.valoare}</p>
          </div>
        ))}
      </div>

      {/* Alertă eroare toggle */}
      {eroareToggle && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{eroareToggle}</span>
          <button onClick={() => setEroareToggle("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Bara de acțiuni */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Caută după nume sau email..."
          value={cautare}
          onChange={(e) => setCautare(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
        />
        <select
          value={filtruRol}
          onChange={(e) => setFiltruRol(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm bg-white"
        >
          <option value="">Toate rolurile</option>
          {ROLURI_MEDICALE.map((r) => (
            <option key={r.valoare} value={r.valoare}>{r.eticheta}</option>
          ))}
        </select>
        <button
          onClick={() => setAfiseazaModalNou(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-400 text-white rounded-lg font-semibold hover:bg-rose-500 transition-colors text-sm shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Cont nou
        </button>
      </div>

      {/* Tabel utilizatori */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {utilizatoriFiltrati.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            {cautare || filtruRol ? "Niciun rezultat pentru filtrele aplicate." : "Nu există utilizatori înregistrați."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Utilizator</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Coordonator</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Activ</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {utilizatoriFiltrati.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${!u.is_active ? "opacity-50" : ""}`}>
                    {/* Utilizator */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {u.full_name ?? <span className="text-slate-400 italic">Fără nume</span>}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                    </td>

                    {/* Rol */}
                    <td className="px-5 py-4">
                      <BadgeRol rol={u.role} />
                    </td>

                    {/* Toggle coordonator */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          activ={u.is_coordinator}
                          disabled={pending || !u.is_active}
                          onToggle={() => toggle(u.id, "is_coordinator", !u.is_coordinator)}
                        />
                      </div>
                    </td>

                    {/* Toggle activ */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          activ={u.is_active}
                          disabled={pending}
                          onToggle={() => toggle(u.id, "is_active", !u.is_active)}
                        />
                      </div>
                    </td>

                    {/* Acțiuni */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setUtilizatorDeEditat(u)}
                          className="text-xs font-medium text-slate-600 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50"
                        >
                          Editează
                        </button>
                        {u.role !== "admin" && (
                          <button
                            onClick={() => setUtilizatorDesters(u)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Șterge cont"
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

      <p className="mt-3 text-xs text-slate-400 text-right">
        {utilizatoriFiltrati.length} din {utilizatori.length} utilizatori
      </p>
    </>
  );
}
