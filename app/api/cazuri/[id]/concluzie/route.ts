import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const cazId = params.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corp cerere invalid" }, { status: 400 });
  }

  const content = (body as { content?: unknown }).content;
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return NextResponse.json({ error: "Conținut invalid" }, { status: 422 });
  }

  const service = createServiceClient();

  // Verifică că utilizatorul este coordonator activ
  const { data: profil } = await service
    .from("users")
    .select("role, is_coordinator, is_active")
    .eq("id", user.id)
    .single() as unknown as {
      data: { role: string; is_coordinator: boolean; is_active: boolean } | null;
      error: unknown;
    };

  if (!profil?.is_active) {
    return NextResponse.json({ error: "Cont inactiv" }, { status: 403 });
  }
  if (!profil?.is_coordinator) {
    return NextResponse.json(
      { error: "Doar coordonatorii pot adăuga concluzia finală" },
      { status: 403 }
    );
  }

  // Verifică că există cazul și nu e deja finalizat
  const { data: caz } = await service
    .from("cases")
    .select("id, status")
    .eq("id", cazId)
    .single() as unknown as {
      data: { id: string; status: string } | null;
      error: unknown;
    };

  if (!caz) return NextResponse.json({ error: "Caz negăsit" }, { status: 404 });

  if (caz.status === "trimis" || caz.status === "arhivat") {
    return NextResponse.json({ error: "Cazul este deja finalizat" }, { status: 409 });
  }

  // Caută concluzie existentă a acestui coordonator pentru acest caz
  const { data: concluzieExistenta } = await service
    .from("specialist_inputs")
    .select("id")
    .eq("case_id", cazId)
    .eq("user_id", user.id)
    .eq("is_coordinator_conclusion", true)
    .single() as unknown as { data: { id: string } | null; error: unknown };

  let inputId: string;
  const esteActualizare = !!concluzieExistenta;

  if (concluzieExistenta) {
    const { data: updated, error } = await service
      .from("specialist_inputs")
      .update({ content: content, updated_at: new Date().toISOString() } as never)
      .eq("id", concluzieExistenta.id)
      .select("id")
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (error || !updated) {
      console.error("Eroare update concluzie:", error);
      return NextResponse.json({ error: "Eroare la salvarea concluziei" }, { status: 500 });
    }
    inputId = updated.id;
  } else {
    const { data: inserted, error } = await service
      .from("specialist_inputs")
      .insert({
        case_id: cazId,
        user_id: user.id,
        role_at_time: profil.role,
        content: content as never,
        is_coordinator_conclusion: true,
      } as never)
      .select("id")
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (error || !inserted) {
      console.error("Eroare inserare concluzie:", error);
      return NextResponse.json({ error: "Eroare la salvarea concluziei" }, { status: 500 });
    }
    inputId = inserted.id;
  }

  // Audit log
  try {
    await service.from("audit_logs").insert({
      user_id: user.id,
      action: esteActualizare ? "update" : "create",
      resource_type: "specialist_inputs",
      resource_id: inputId,
      case_id: cazId,
      notes: `${esteActualizare ? "Actualizare" : "Adăugare"} concluzie coordonator`,
    } as never);
  } catch { /* ignorăm */ }

  return NextResponse.json(
    { success: true, inputId },
    { status: esteActualizare ? 200 : 201 }
  );
}
