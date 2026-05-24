import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import Link from "next/link";
import CasesList, { type CazPreview } from "@/components/dashboard/CasesList";
import { ETICHETA_ROL } from "@/lib/roluri";
import { ROLURI_OBLIGATORII } from "@/lib/constante";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/autentificare");

  // Profil utilizator
  const { data: profil } = await supabase
    .from("users")
    .select("full_name, role, is_coordinator, is_active")
    .eq("id", user.id)
    .single() as unknown as {
      data: { full_name: string | null; role: string; is_coordinator: boolean; is_active: boolean } | null;
      error: unknown;
    };

  const esteAdmin = profil?.role === "admin";
  const esteCoordinator = profil?.is_coordinator ?? false;
  const etichetaRol = ETICHETA_ROL[profil?.role ?? ""] ?? profil?.role ?? "—";

  // Cazuri cu inputurile specialiștilor (pentru progres)
  const service = createServiceClient();
  const { data: cazuriRaw } = await service
    .from("cases")
    .select("id, patient_name, patient_email, status, created_at, specialist_inputs(role_at_time)")
    .order("created_at", { ascending: false }) as unknown as {
      data: {
        id: string;
        patient_name: string;
        patient_email: string;
        status: string;
        created_at: string;
        specialist_inputs: { role_at_time: string }[];
      }[] | null;
      error: unknown;
    };

  // Calculează progresul per caz
  const cazuri: CazPreview[] = (cazuriRaw ?? []).map((c) => {
    const roluriCompletate = new Set(
      c.specialist_inputs
        .map((i) => i.role_at_time)
        .filter((r) => (ROLURI_OBLIGATORII as readonly string[]).includes(r))
    );
    return {
      id: c.id,
      patient_name: c.patient_name,
      patient_email: c.patient_email,
      status: c.status,
      created_at: c.created_at,
      completati: roluriCompletate.size,
    };
  });

  // Statistici
  const nrNou = cazuri.filter((c) => c.status === "nou").length;
  const nrInLucru = cazuri.filter((c) => c.status === "in_lucru").length;
  const nrFinalizate = cazuri.filter((c) =>
    c.status === "gata_expediere" || c.status === "trimis"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">DEM</span>
            </div>
            {esteAdmin && (
              <nav className="hidden sm:flex items-center gap-1 ml-2">
                <span className="text-sm font-semibold text-slate-900 px-3 py-1.5 bg-slate-100 rounded-lg">
                  Dashboard
                </span>
                <Link
                  href="/admin"
                  className="text-sm text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Admin
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-900">
                {profil?.full_name ?? user.email}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">{etichetaRol}</span>
                {esteCoordinator && (
                  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-1.5 py-0.5 rounded">
                    Coordonator
                  </span>
                )}
              </div>
            </div>
            <form action={logout}>
              <button type="submit"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Deconectare
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Conținut */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Bună ziua, {profil?.full_name?.split(" ")[0] ?? "doctor"}!
          </h1>
          <p className="text-slate-500 mt-1">
            {cazuri.length === 0
              ? "Nu există cazuri înregistrate încă."
              : `${cazuri.length} ${cazuri.length === 1 ? "caz înregistrat" : "cazuri înregistrate"} în sistem.`}
          </p>
        </div>

        {/* Statistici */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { eticheta: "Cazuri noi", valoare: nrNou, culoare: "text-blue-600" },
            { eticheta: "În lucru", valoare: nrInLucru, culoare: "text-amber-600" },
            { eticheta: "Finalizate", valoare: nrFinalizate, culoare: "text-green-600" },
          ].map((card) => (
            <div key={card.eticheta} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">{card.eticheta}</p>
              <p className={`text-3xl font-bold ${card.culoare}`}>{card.valoare}</p>
            </div>
          ))}
        </div>

        {/* Lista cazuri */}
        <CasesList cazuri={cazuri} />
      </main>
    </div>
  );
}
