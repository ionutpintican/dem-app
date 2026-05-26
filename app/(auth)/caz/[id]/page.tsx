import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import Link from "next/link";
import { ETICHETA_ROL } from "@/lib/roluri";
import { STATUS_CONFIG, ROLURI_OBLIGATORII, TOTAL_OBLIGATORII } from "@/lib/constante";
import SpecialistInputForm from "@/components/forms/SpecialistInputForm";
import CoordinatorPanel from "@/components/forms/CoordinatorPanel";
import HeaderBrand from "@/components/layout/HeaderBrand";

const ETICHETA_CATEGORIE: Record<string, string> = {
  analiza: "Analiză",
  imagistica: "Imagistică",
  reteta: "Rețetă",
  trimitere: "Trimitere",
  altele: "Altele",
};

export default async function CazPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/autentificare");

  const { id } = params;
  const service = createServiceClient();

  // Preia profilul utilizatorului curent
  const { data: profil } = await supabase
    .from("users")
    .select("full_name, role, is_coordinator")
    .eq("id", user.id)
    .single() as unknown as {
      data: { full_name: string | null; role: string; is_coordinator: boolean } | null;
      error: unknown;
    };

  // Preia cazul
  const { data: caz } = await service
    .from("cases")
    .select("*")
    .eq("id", id)
    .single() as unknown as {
      data: {
        id: string;
        patient_name: string;
        patient_email: string;
        patient_dob: string;
        patient_phone: string | null;
        description: string;
        status: string;
        created_at: string;
        decision_sent_at: string | null;
      } | null;
      error: unknown;
    };

  if (!caz) notFound();

  // Preia fișierele cu URL-uri semnate
  const { data: fisiere } = await service
    .from("case_files")
    .select("id, file_name, file_path, file_size, category, created_at")
    .eq("case_id", id)
    .order("created_at", { ascending: true }) as unknown as {
      data: {
        id: string;
        file_name: string;
        file_path: string;
        file_size: number | null;
        category: string;
        created_at: string;
      }[] | null;
      error: unknown;
    };

  // Generează URL-uri semnate pentru download (valabile 1 oră)
  const fisiereWithUrls = await Promise.all(
    (fisiere ?? []).map(async (f) => {
      const { data } = await service.storage
        .from("medical-files")
        .createSignedUrl(f.file_path, 3600);
      return { ...f, downloadUrl: data?.signedUrl ?? null };
    })
  );

  // Preia inputurile specialiștilor
  const { data: inputuri } = await service
    .from("specialist_inputs")
    .select("id, user_id, role_at_time, content, is_coordinator_conclusion, created_at, updated_at")
    .eq("case_id", id)
    .order("created_at", { ascending: true }) as unknown as {
      data: {
        id: string;
        user_id: string;
        role_at_time: string;
        content: Record<string, unknown>;
        is_coordinator_conclusion: boolean;
        created_at: string;
        updated_at: string;
      }[] | null;
      error: unknown;
    };

  // Audit log — VIEW_CASE
  try {
    await service.from("audit_logs").insert({
      user_id: user.id,
      action: "view",
      resource_type: "cases",
      resource_id: id,
      case_id: id,
    } as never);
  } catch { /* ignorăm */ }

  // Calcul progres
  const roluriCompletate = new Set(
    (inputuri ?? [])
      .map((i) => i.role_at_time)
      .filter((r) => (ROLURI_OBLIGATORII as readonly string[]).includes(r))
  );
  const nrCompletati = roluriCompletate.size;
  const statusCfg = STATUS_CONFIG[caz.status] ?? STATUS_CONFIG.nou;

  // Inputul curentului utilizator (dacă există) — exclusiv concluzia de coordonator
  const inputulMeu = profil?.role !== "admin"
    ? ((inputuri ?? []).find((i) => i.user_id === user.id && !i.is_coordinator_conclusion) ?? null)
    : null;
  const contentulMeu = inputulMeu
    ? (inputulMeu.content as Record<string, string>)
    : null;

  // Concluzia coordonatorului (dacă există)
  const concluzieCoord = (inputuri ?? []).find((i) => i.is_coordinator_conclusion) ?? null;
  const contentConcluzieCoord = concluzieCoord
    ? (concluzieCoord.content as { decizie_finala?: string; recomandari?: string })
    : null;

  // Roluri obligatorii care nu au completat încă (pentru afișaj în CoordinatorPanel)
  const roluriLipsa = (ROLURI_OBLIGATORII as readonly string[]).filter(
    (r) => !roluriCompletate.has(r)
  );

  function formatBytes(bytes: number | null) {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="min-h-screen">

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <HeaderBrand href="/dashboard" />
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 min-w-0">
              <span className="text-slate-300">/</span>
              <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
                Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-900 truncate max-w-[240px]">
                {caz.patient_name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-900">{profil?.full_name ?? user.email}</span>
              <span className="text-xs text-slate-500">{ETICHETA_ROL[profil?.role ?? ""] ?? profil?.role}</span>
            </div>
            <form action={logout}>
              <button type="submit" aria-label="Deconectare" className="text-sm text-slate-400 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Titlu + status */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{caz.patient_name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              Dosar înregistrat pe {new Date(caz.created_at).toLocaleDateString("ro-RO", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full shrink-0 ${statusCfg.culoare}`}>
            <span className={`w-2 h-2 rounded-full ${statusCfg.punct}`} />
            {statusCfg.eticheta}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coloana stânga — date pacient + fișiere */}
          <div className="lg:col-span-1 space-y-4">

            {/* Date pacient */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Date pacient</h2>
              <dl className="space-y-3">
                {[
                  { label: "Nume complet", valoare: caz.patient_name },
                  { label: "Email", valoare: caz.patient_email },
                  {
                    label: "Data nașterii",
                    valoare: new Date(caz.patient_dob).toLocaleDateString("ro-RO"),
                  },
                  { label: "Telefon", valoare: caz.patient_phone ?? "—" },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-slate-400">{item.label}</dt>
                    <dd className="text-sm text-slate-800 font-medium mt-0.5">{item.valoare}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Descriere */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Descriere caz</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{caz.description}</p>
            </div>

            {/* Fișiere */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                Documente ({fisiereWithUrls.length})
              </h2>
              {fisiereWithUrls.length === 0 ? (
                <p className="text-sm text-slate-400">Niciun fișier atașat.</p>
              ) : (
                <ul className="space-y-2">
                  {fisiereWithUrls.map((f) => (
                    <li key={f.id}>
                      {f.downloadUrl ? (
                        <a
                          href={f.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-colors group"
                        >
                          <svg className="w-8 h-8 text-slate-300 group-hover:text-rose-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-700 truncate">{f.file_name}</p>
                            <p className="text-xs text-slate-400">
                              {ETICHETA_CATEGORIE[f.category] ?? f.category}
                              {f.file_size ? ` · ${formatBytes(f.file_size)}` : ""}
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-slate-300 group-hover:text-green-500 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      ) : (
                        <div className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 opacity-50">
                          <p className="text-xs text-slate-500 truncate">{f.file_name}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Coloana dreapta — progres + inputuri */}
          <div className="lg:col-span-2 space-y-4">

            {/* Progres echipă */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Progres echipă
                </h2>
                <span className="text-sm font-bold text-slate-900">
                  {nrCompletati}/{TOTAL_OBLIGATORII} obligatorii
                </span>
              </div>

              {/* Bara progres globală */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${nrCompletati === TOTAL_OBLIGATORII ? "bg-green-500" : "bg-green-500"}`}
                  style={{ width: `${(nrCompletati / TOTAL_OBLIGATORII) * 100}%` }}
                />
              </div>

              {/* Roluri individuale */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROLURI_OBLIGATORII.map((rol) => {
                  const completat = roluriCompletate.has(rol);
                  return (
                    <div key={rol} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                      completat ? "bg-rose-50 text-rose-400" : "bg-slate-50 text-slate-400"
                    }`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${completat ? "bg-green-500" : "bg-slate-300"}`} />
                      {ETICHETA_ROL[rol] ?? rol}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panoul coordonatorului */}
            {profil?.is_coordinator && (
              <CoordinatorPanel
                cazId={id}
                cazStatus={caz.status}
                patientEmail={caz.patient_email}
                concluzieExistenta={contentConcluzieCoord}
                roluriLipsa={roluriLipsa}
              />
            )}

            {/* Formularul specialistului curent */}
            {profil?.role !== "admin" && (
              <SpecialistInputForm
                cazId={id}
                rol={profil?.role ?? ""}
                cazStatus={caz.status}
                inputExistent={contentulMeu}
              />
            )}

            {/* Inputuri specialiști */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                Evaluări specialiști ({(inputuri ?? []).length})
              </h2>

              {(inputuri ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Niciun specialist nu a adăugat evaluarea încă.
                </p>
              ) : (
                <div className="space-y-4">
                  {(inputuri ?? []).map((inp) => (
                    <div key={inp.id} className={`rounded-xl border p-4 ${
                      inp.is_coordinator_conclusion
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-200 bg-slate-50"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            inp.is_coordinator_conclusion
                              ? "bg-amber-100 text-amber-700"
                              : "bg-white border border-slate-200 text-slate-600"
                          }`}>
                            {inp.is_coordinator_conclusion
                              ? "Concluzie Coordonator"
                              : (ETICHETA_ROL[inp.role_at_time] ?? inp.role_at_time)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(inp.updated_at).toLocaleDateString("ro-RO", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Conținut input */}
                      {Object.entries(inp.content).length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Fără detalii adăugate.</p>
                      ) : (
                        <dl className="space-y-2">
                          {Object.entries(inp.content).map(([cheie, valoare]) => (
                            <div key={cheie}>
                              <dt className="text-xs text-slate-400 capitalize">
                                {cheie.replace(/_/g, " ")}
                              </dt>
                              <dd className="text-sm text-slate-700 mt-0.5">
                                {typeof valoare === "string" ? valoare : JSON.stringify(valoare)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
