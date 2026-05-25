import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const cazId = params.id;
  const service = createServiceClient();

  const { data: profil } = await service
    .from("users")
    .select("role, is_active")
    .eq("id", user.id)
    .single() as unknown as {
      data: { role: string; is_active: boolean } | null;
      error: unknown;
    };

  if (!profil?.is_active) return NextResponse.json({ error: "Cont inactiv" }, { status: 403 });
  if (profil?.role !== "admin") {
    return NextResponse.json({ error: "Doar administratorii pot șterge cazuri" }, { status: 403 });
  }

  const { data: caz } = await service
    .from("cases")
    .select("id")
    .eq("id", cazId)
    .single() as unknown as { data: { id: string } | null; error: unknown };

  if (!caz) return NextResponse.json({ error: "Caz negăsit" }, { status: 404 });

  // Șterge fișierele din storage înainte de a șterge înregistrările din DB
  const { data: fisiere } = await service
    .from("case_files")
    .select("file_path")
    .eq("case_id", cazId) as unknown as {
      data: { file_path: string }[] | null;
      error: unknown;
    };

  if (fisiere && fisiere.length > 0) {
    const cai = fisiere.map((f) => f.file_path);
    await service.storage.from("medical-files").remove(cai);
  }

  // Șterge înregistrările dependente explicit (pentru cazul fără CASCADE)
  await service.from("case_files").delete().eq("case_id", cazId);
  await service.from("specialist_inputs").delete().eq("case_id", cazId);

  // Audit log înainte de ștergere (case_id va deveni NULL după)
  try {
    await service.from("audit_logs").insert({
      user_id: user.id,
      action: "delete",
      resource_type: "cases",
      resource_id: cazId,
      case_id: cazId,
      notes: "Caz șters de administrator",
    } as never);
  } catch { /* ignorăm */ }

  const { error: deleteError } = await service
    .from("cases")
    .delete()
    .eq("id", cazId) as { error: unknown };

  if (deleteError) {
    console.error("Eroare ștergere caz:", deleteError);
    return NextResponse.json(
      { error: "Eroare la ștergere. Verifică dacă există înregistrări asociate." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
