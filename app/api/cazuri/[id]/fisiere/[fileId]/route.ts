import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// GET /api/cazuri/[id]/fisiere/[fileId] — generează un signed URL on-demand.
// URL-urile nu se mai generează la încărcarea paginii, astfel încât fiecare
// accesare de fișier medical să lase o urmă în audit_logs (cerință GDPR).
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const { id: cazId, fileId } = params;
  const service = createServiceClient();

  const { data: profil } = await service
    .from("users")
    .select("is_active")
    .eq("id", user.id)
    .single() as unknown as { data: { is_active: boolean } | null; error: unknown };

  if (!profil?.is_active) {
    return NextResponse.json({ error: "Cont inactiv" }, { status: 403 });
  }

  // Fișierul trebuie să aparțină cazului din URL — altfel 404
  const { data: fisier } = await service
    .from("case_files")
    .select("id, file_name, file_path")
    .eq("id", fileId)
    .eq("case_id", cazId)
    .single() as unknown as {
      data: { id: string; file_name: string; file_path: string } | null;
      error: unknown;
    };

  if (!fisier) return NextResponse.json({ error: "Fișier negăsit" }, { status: 404 });

  // ?download=1 → URL cu Content-Disposition de download (pentru doc/docx)
  const caDownload = request.nextUrl.searchParams.get("download") === "1";

  const { data: semnat, error: urlError } = await service.storage
    .from("medical-files")
    .createSignedUrl(
      fisier.file_path,
      300, // 5 minute — generat la click, nu la load
      caDownload ? { download: fisier.file_name } : undefined
    );

  if (urlError || !semnat?.signedUrl) {
    console.error("Eroare generare signed URL:", urlError);
    return NextResponse.json({ error: "Eroare la generarea linkului" }, { status: 500 });
  }

  // Audit download. Folosim action "view" + notes (enum-ul audit_action din DB
  // nu are încă "download" — vezi migrarea 002; după aplicare se poate trece pe ea)
  try {
    await service.from("audit_logs").insert({
      user_id: user.id,
      action: "view",
      resource_type: "case_files",
      resource_id: fileId,
      case_id: cazId,
      notes: `Download fișier: ${fisier.file_name}`,
    } as never);
  } catch { /* non-blocking */ }

  return NextResponse.json({ url: semnat.signedUrl });
}
