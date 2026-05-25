import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ROLURI_OBLIGATORII } from "@/lib/constante";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const cazId = params.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corp cerere invalid" }, { status: 400 });
  }

  const content = (body as { content?: unknown }).content;
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return NextResponse.json({ error: "Câmpul content lipsește sau este invalid" }, { status: 422 });
  }

  const service = createServiceClient();

  // Preia profilul utilizatorului
  const { data: profil } = await service
    .from("users")
    .select("role, is_active")
    .eq("id", user.id)
    .single() as unknown as {
      data: { role: string; is_active: boolean } | null;
      error: unknown;
    };

  if (!profil || !profil.is_active) {
    return NextResponse.json({ error: "Cont inactiv sau neautorizat" }, { status: 403 });
  }

  if (profil.role === "admin") {
    return NextResponse.json(
      { error: "Administratorul nu poate adăuga evaluare de specialist" },
      { status: 403 }
    );
  }

  // Verifică că există cazul
  const { data: caz } = await service
    .from("cases")
    .select("id, status")
    .eq("id", cazId)
    .single() as unknown as {
      data: { id: string; status: string } | null;
      error: unknown;
    };

  if (!caz) {
    return NextResponse.json({ error: "Caz negăsit" }, { status: 404 });
  }

  // Caută input existent al acestui user pentru acest caz (exclusiv concluzia de coordonator)
  const { data: inputExistent } = await service
    .from("specialist_inputs")
    .select("id")
    .eq("case_id", cazId)
    .eq("user_id", user.id)
    .eq("is_coordinator_conclusion", false)
    .single() as unknown as {
      data: { id: string } | null;
      error: unknown;
    };

  let inputId: string;
  const esteActualizare = !!inputExistent;

  if (inputExistent) {
    // UPDATE
    const { data: updated, error } = await service
      .from("specialist_inputs")
      .update({
        content: content,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", inputExistent.id)
      .select("id")
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (error || !updated) {
      console.error("Eroare update input specialist:", error);
      return NextResponse.json({ error: "Eroare la salvarea evaluării" }, { status: 500 });
    }
    inputId = updated.id;
  } else {
    // INSERT
    const { data: inserted, error } = await service
      .from("specialist_inputs")
      .insert({
        case_id: cazId,
        user_id: user.id,
        role_at_time: profil.role,
        content: content as never,
        is_coordinator_conclusion: false,
      } as never)
      .select("id")
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (error || !inserted) {
      console.error("Eroare inserare input specialist:", error);
      return NextResponse.json({ error: "Eroare la salvarea evaluării" }, { status: 500 });
    }
    inputId = inserted.id;
  }

  // Tranziție status caz: nou → in_lucru
  if (caz.status === "nou") {
    await service
      .from("cases")
      .update({ status: "in_lucru" } as never)
      .eq("id", cazId);
  }

  // Verifică dacă toți 6 obligatorii au completat → gata_expediere
  if (caz.status !== "trimis" && caz.status !== "arhivat") {
    const { data: toateInputurile } = await service
      .from("specialist_inputs")
      .select("role_at_time")
      .eq("case_id", cazId) as unknown as {
        data: { role_at_time: string }[] | null;
        error: unknown;
      };

    const roluriCompletate = new Set(
      (toateInputurile ?? [])
        .map((i) => i.role_at_time)
        .filter((r) => (ROLURI_OBLIGATORII as readonly string[]).includes(r))
    );

    if (roluriCompletate.size === ROLURI_OBLIGATORII.length) {
      await service
        .from("cases")
        .update({ status: "gata_expediere" } as never)
        .eq("id", cazId)
        .not("status", "in", '("trimis","arhivat")');
    }
  }

  // Audit log
  try {
    await service.from("audit_logs").insert({
      user_id: user.id,
      action: esteActualizare ? "update" : "create",
      resource_type: "specialist_inputs",
      resource_id: inputId,
      case_id: cazId,
      notes: `${esteActualizare ? "Actualizare" : "Adăugare"} evaluare ${profil.role}`,
    } as never);
  } catch { /* ignorăm */ }

  return NextResponse.json(
    { success: true, inputId },
    { status: esteActualizare ? 200 : 201 }
  );
}
