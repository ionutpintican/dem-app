import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ROLURI_MEDICALE } from "@/lib/roluri";

// PATCH /api/profil — actualizare specializare proprie
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const body = await request.json();
  const { rol } = body as { rol: string };

  const roluriValide = ROLURI_MEDICALE.map((r) => r.valoare) as string[];
  if (!roluriValide.includes(rol)) {
    return NextResponse.json({ error: "Specializare invalidă" }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("users")
    .update({ role: rol } as never)
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/dashboard");
  return NextResponse.json({ success: true });
}
