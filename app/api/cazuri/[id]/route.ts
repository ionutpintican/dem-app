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
    .single() as unknown as {
      data: { id: string } | null;
      error: unknown;
    };

  if (!caz) return NextResponse.json({ error: "Caz negăsit" }, { status: 404 });

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

  const { error } = await service
    .from("cases")
    .delete()
    .eq("id", cazId) as { error: unknown };

  if (error) {
    return NextResponse.json({ error: "Eroare la ștergere" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
