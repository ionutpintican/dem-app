import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
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
    .select("is_coordinator, is_active")
    .eq("id", user.id)
    .single() as unknown as {
      data: { is_coordinator: boolean; is_active: boolean } | null;
      error: unknown;
    };

  if (!profil?.is_active) return NextResponse.json({ error: "Cont inactiv" }, { status: 403 });
  if (!profil?.is_coordinator) {
    return NextResponse.json({ error: "Doar coordonatorii pot redeschide fișa" }, { status: 403 });
  }

  const { data: caz } = await service
    .from("cases")
    .select("id, status")
    .eq("id", cazId)
    .single() as unknown as {
      data: { id: string; status: string } | null;
      error: unknown;
    };

  if (!caz) return NextResponse.json({ error: "Caz negăsit" }, { status: 404 });
  if (caz.status !== "trimis") {
    return NextResponse.json({ error: "Fișa nu este în starea trimis" }, { status: 409 });
  }

  await service
    .from("cases")
    .update({ status: "in_lucru", decision_sent_at: null } as never)
    .eq("id", cazId);

  try {
    await service.from("audit_logs").insert({
      user_id: user.id,
      action: "reopen",
      resource_type: "cases",
      resource_id: cazId,
      case_id: cazId,
      notes: "Fișă redeschisă de coordonator",
    } as never);
  } catch { /* ignorăm */ }

  return NextResponse.json({ success: true }, { status: 200 });
}
