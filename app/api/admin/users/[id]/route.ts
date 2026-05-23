import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function verificaAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single() as unknown as { data: { role: string } | null; error: unknown };

  if (data?.role !== "admin") return null;
  return user;
}

// PATCH /api/admin/users/[id] — actualizare cont
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await verificaAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  const service = await createServiceClient();

  // Regulă de business: nu poți dezactiva singurul Coordonator activ
  if (body.is_active === false) {
    const { data: profil } = await service
      .from("users")
      .select("is_coordinator")
      .eq("id", id)
      .single() as unknown as { data: { is_coordinator: boolean } | null; error: unknown };

    if (profil?.is_coordinator) {
      const { data: coordonatori } = await service
        .from("users")
        .select("id")
        .eq("is_coordinator", true)
        .eq("is_active", true) as unknown as { data: { id: string }[] | null; error: unknown };

      if (coordonatori && coordonatori.length === 1) {
        return NextResponse.json(
          {
            error:
              "Nu poți dezactiva singurul Coordonator activ. Asignează mai întâi un alt Coordonator.",
          },
          { status: 400 }
        );
      }
    }
  }

  // Câmpurile permise pentru actualizare
  const campuriPermise = ["full_name", "email", "role", "is_coordinator", "is_active"];
  const actualizare: Record<string, unknown> = {};
  for (const camp of campuriPermise) {
    if (body[camp] !== undefined) actualizare[camp] = body[camp];
  }

  const { error } = await service
    .from("users")
    .update(actualizare as never)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
