import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import Link from "next/link";
import CasesList, { type CazPreview } from "@/components/dashboard/CasesList";
import FeedbackModal from "@/components/dashboard/FeedbackModal";
import { ETICHETA_ROL } from "@/lib/roluri";
import { ROLURI_OBLIGATORII, PAGE_SIZE } from "@/lib/constante";
import HeaderBrand from "@/components/layout/HeaderBrand";

const SORTARI_VALIDE = ["recent", "vechi", "alfa", "status", "progres"] as const;
export type Sortare = (typeof SORTARI_VALIDE)[number];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { page?: string; sort?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/autentificare");

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const sort: Sortare = (SORTARI_VALIDE as readonly string[]).includes(searchParams.sort ?? "")
    ? (searchParams.sort as Sortare)
    : "recent";

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

  // Sortările pe coloane DB se fac în query; status/progres se sortează
  // client-side pe pagina curentă (în CasesList)
  const orderConfig =
    sort === "vechi"
      ? { column: "created_at", ascending: true }
      : sort === "alfa"
        ? { column: "patient_name", ascending: true }
        : { column: "created_at", ascending: false };

  // Cazuri paginate (25/pagină) + count total, cu inputurile specialiștilor
  const service = createServiceClient();
  const { data: cazuriRaw, count } = await service
    .from("cases")
    .select(
      "id, patient_name, patient_email, status, created_at, specialist_inputs(role_at_time, user_id, is_coordinator_conclusion)",
      { count: "exact" }
    )
    .order(orderConfig.column, { ascending: orderConfig.ascending })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1) as unknown as {
      data: {
        id: string;
        patient_name: string;
        patient_email: string;
        status: string;
        created_at: string;
        specialist_inputs: {
          role_at_time: string;
          user_id: string;
          is_coordinator_conclusion: boolean;
        }[];
      }[] | null;
      count: number | null;
      error: unknown;
    };

  const totalCazuri = count ?? 0;
  const totalPagini = Math.max(1, Math.ceil(totalCazuri / PAGE_SIZE));

  // Calculează progresul per caz + dacă userul curent are deja evaluare
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
      are_evaluarea_mea: c.specialist_inputs.some(
        (i) => i.user_id === user.id && !i.is_coordinator_conclusion
      ),
    };
  });

  // Statistici globale — query ușor (doar coloana status), nu tot payload-ul
  const { data: statusuri } = await service
    .from("cases")
    .select("status") as unknown as { data: { status: string }[] | null; error: unknown };

  const nrNou = (statusuri ?? []).filter((c) => c.status === "nou").length;
  const nrInLucru = (statusuri ?? []).filter((c) => c.status === "in_lucru").length;
  const nrFinalizate = (statusuri ?? []).filter(
    (c) => c.status === "gata_expediere" || c.status === "trimis"
  ).length;

  return (
    <div className="min-h-screen">

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <HeaderBrand href="/dashboard" />
            {esteAdmin && (
              <nav className="hidden sm:flex items-center gap-1 ml-2">
                <span className="text-sm font-semibold text-slate-900 px-3 py-1.5 bg-slate-100 rounded-lg">
                  Dashboard Admin
                </span>
                <Link
                  href="/admin"
                  className="text-sm text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Users Admin
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <FeedbackModal
              numeUtilizator={profil?.full_name ?? user.email ?? ""}
              rolUtilizator={etichetaRol}
            />
            <Link
              href="/profil"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              title="Profilul meu"
            >
              <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-slate-900 leading-tight">
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
            </Link>
            <form action={logout}>
              <button type="submit" aria-label="Deconectare"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Deconectare</span>
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
            {totalCazuri === 0
              ? "Nu există cazuri înregistrate încă."
              : `${totalCazuri} ${totalCazuri === 1 ? "caz înregistrat" : "cazuri înregistrate"} în sistem.`}
          </p>
        </div>

        {/* Statistici */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { eticheta: "Cazuri noi", valoare: nrNou, culoare: "text-rose-400" },
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
        <CasesList cazuri={cazuri} esteAdmin={esteAdmin} sort={sort} />

        {/* Paginare */}
        {totalPagini > 1 && (
          <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Paginare">
            <Link
              href={`/dashboard?page=${page - 1}&sort=${sort}`}
              aria-disabled={page <= 1}
              tabIndex={page <= 1 ? -1 : undefined}
              className={page <= 1
                ? "text-slate-300 pointer-events-none"
                : "text-rose-400 hover:text-rose-500 font-medium"}
            >
              ← Anterioară
            </Link>
            <span className="text-slate-500">Pagina {page} din {totalPagini}</span>
            <Link
              href={`/dashboard?page=${page + 1}&sort=${sort}`}
              aria-disabled={page >= totalPagini}
              tabIndex={page >= totalPagini ? -1 : undefined}
              className={page >= totalPagini
                ? "text-slate-300 pointer-events-none"
                : "text-rose-400 hover:text-rose-500 font-medium"}
            >
              Următoarea →
            </Link>
          </nav>
        )}
      </main>
    </div>
  );
}
