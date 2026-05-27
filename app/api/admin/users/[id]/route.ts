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
  const service = createServiceClient();

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

// DELETE /api/admin/users/[id] — ștergere cont doctor
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await verificaAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
  }

  const { id } = params;
  const service = createServiceClient();

  if (id === admin.id) {
    return NextResponse.json({ error: "Nu poți șterge propriul cont." }, { status: 400 });
  }

  const { data: tinta } = await service
    .from("users")
    .select("role, is_coordinator, full_name")
    .eq("id", id)
    .single() as unknown as { data: { role: string; is_coordinator: boolean; full_name: string | null } | null; error: unknown };

  if (!tinta) {
    return NextResponse.json({ error: "Utilizatorul nu există." }, { status: 404 });
  }
  if (tinta.role === "admin") {
    return NextResponse.json({ error: "Nu poți șterge un cont de administrator." }, { status: 400 });
  }

  // Nu poți șterge singurul coordonator activ
  if (tinta.is_coordinator) {
    const { data: coordonatori } = await service
      .from("users")
      .select("id")
      .eq("is_coordinator", true)
      .eq("is_active", true) as unknown as { data: { id: string }[] | null; error: unknown };

    const altiiActivi = (coordonatori ?? []).filter((c) => c.id !== id);
    if (altiiActivi.length === 0) {
      return NextResponse.json(
        { error: "Nu poți șterge singurul Coordonator activ. Asignează mai întâi un alt Coordonator." },
        { status: 400 }
      );
    }
  }

  // Pas 1: soft delete — întotdeauna reușește, blochează accesul prin middleware
  await service
    .from("users")
    .update({ is_active: false, is_coordinator: false } as never)
    .eq("id", id);

  // Pas 2: ștergere din auth
  // Dacă doctorul are contribuții în specialist_inputs (FK RESTRICT), cascade-ul eșuează.
  // În acel caz anonimizăm email-ul pentru a elibera adresa originală și a marca
  // contul ca șters definitiv (astfel nu va mai apărea în lista de useri).
  const { error: authDeleteError } = await service.auth.admin.deleteUser(id);
  if (authDeleteError) {
    const emailAnonimat = `deleted_${id}@deleted.invalid`;
    const { error: updateEmailError } = await service.auth.admin.updateUserById(id, {
      email: emailAnonimat,
    });
    if (!updateEmailError) {
      // Sincronizăm email-ul și în profilul public
      await service
        .from("users")
        .update({ email: emailAnonimat } as never)
        .eq("id", id);
    }
  }

  // Audit
  try {
    await service.from("audit_logs").insert({
      action: "delete",
      table_name: "users",
      record_id: id,
      notes: `Cont șters de admin: ${tinta.full_name ?? id}`,
    } as never);
  } catch { /* non-blocking */ }

  return NextResponse.json({ success: true });
}
