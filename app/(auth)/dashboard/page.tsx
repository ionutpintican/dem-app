import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/lib/auth/actions";

const ETICHETE_ROL: Record<string, string> = {
  radiolog: "Radiolog",
  oncolog: "Oncolog",
  chirurg_oncolog: "Chirurg Oncolog",
  chirurg_plastician: "Chirurg Plastician",
  radioterapeut: "Radioterapeut",
  genetician: "Genetician",
  psiholog: "Psiholog",
  nutritionist: "Nutriționist",
  admin: "Administrator",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/autentificare");

  // Preia profilul complet din tabela users
  const { data: profil } = await supabase
    .from("users")
    .select("full_name, role, is_coordinator, is_active")
    .eq("id", user.id)
    .single() as unknown as {
      data: {
        full_name: string | null;
        role: string;
        is_coordinator: boolean;
        is_active: boolean;
      } | null;
      error: unknown;
    };

  const numeAfisat = profil?.full_name ?? user.email ?? "—";
  const rol = profil?.role ?? "—";
  const etichetaRol = ETICHETE_ROL[rol] ?? rol;
  const esteCoordinator = profil?.is_coordinator ?? false;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">DEM</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Info utilizator */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-900">{numeAfisat}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">{etichetaRol}</span>
                {esteCoordinator && (
                  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-1.5 py-0.5 rounded">
                    Coordonator
                  </span>
                )}
              </div>
            </div>

            {/* Buton logout */}
            <form action={logout}>
              <button
                type="submit"
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
            Cazurile noi apărute în sistem vor fi afișate mai jos.
          </p>
        </div>

        {/* Statistici placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[
            { eticheta: "Cazuri noi", valoare: "—", culoare: "text-blue-600" },
            { eticheta: "În lucru", valoare: "—", culoare: "text-amber-600" },
            { eticheta: "Finalizate", valoare: "—", culoare: "text-green-600" },
          ].map((card) => (
            <div key={card.eticheta} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">{card.eticheta}</p>
              <p className={`text-3xl font-bold ${card.culoare}`}>{card.valoare}</p>
            </div>
          ))}
        </div>

        {/* Lista cazuri — placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Cazuri recente</h2>
          <div className="text-center py-12 text-slate-400">
            <svg className="mx-auto mb-3 w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Lista cazurilor va apărea aici.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
