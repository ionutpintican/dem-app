import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/autentificare");

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Panou de control</h1>
        <p className="text-slate-600 mb-8">
          Bine ai venit, <span className="font-medium">{user.email}</span>!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { titlu: "Total utilizatori", valoare: "—" },
            { titlu: "Sesiuni active", valoare: "—" },
            { titlu: "Activitate recentă", valoare: "—" },
          ].map((card) => (
            <div
              key={card.titlu}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <p className="text-sm text-slate-500">{card.titlu}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{card.valoare}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
