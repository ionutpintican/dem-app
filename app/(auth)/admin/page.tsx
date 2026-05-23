import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import AdminPanel from "@/components/dashboard/AdminPanel";
import type { Utilizator } from "@/app/api/admin/users/route";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/autentificare");

  const { data: profil } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single() as unknown as { data: { full_name: string | null; role: string } | null; error: unknown };

  if (profil?.role !== "admin") redirect("/dashboard");

  // Preia lista utilizatorilor (cu service role pentru a vedea toți)
  const { createServiceClient } = await import("@/lib/supabase/server");
  const service = await createServiceClient();
  const { data: utilizatori } = await service
    .from("users")
    .select("id, full_name, email, role, is_coordinator, is_active, created_at")
    .order("created_at", { ascending: false }) as unknown as {
      data: Utilizator[] | null;
      error: unknown;
    };

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
            {/* Navigare */}
            <nav className="hidden sm:flex items-center gap-1 ml-4">
              <Link
                href="/dashboard"
                className="text-sm text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-sm font-semibold text-slate-900 px-3 py-1.5 bg-slate-100 rounded-lg">
                Admin
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-900">
                {profil?.full_name ?? user.email}
              </span>
              <span className="text-xs text-slate-500">Administrator</span>
            </div>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestionare conturi</h1>
            <p className="text-slate-500 mt-1">
              Creează și administrează conturile medicilor și atributul de Coordonator.
            </p>
          </div>
        </div>

        <AdminPanel utilizatoriInitiali={utilizatori ?? []} />
      </main>
    </div>
  );
}
