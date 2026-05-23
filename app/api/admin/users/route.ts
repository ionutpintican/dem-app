import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Verifică că userul curent este admin
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

// GET /api/admin/users — lista tuturor utilizatorilor
export async function GET() {
  const admin = await verificaAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
  }

  const service = await createServiceClient();
  const { data: utilizatori, error } = await service
    .from("users")
    .select("id, full_name, email, role, is_coordinator, is_active, created_at")
    .order("created_at", { ascending: false }) as unknown as {
      data: Utilizator[] | null;
      error: unknown;
    };

  if (error) {
    return NextResponse.json({ error: "Eroare la citirea utilizatorilor" }, { status: 500 });
  }

  return NextResponse.json(utilizatori ?? []);
}

// POST /api/admin/users — creare cont nou
export async function POST(request: Request) {
  const admin = await verificaAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
  }

  const body = await request.json();
  const { full_name, email, role, parola_temporara } = body;

  if (!full_name || !email || !role || !parola_temporara) {
    return NextResponse.json({ error: "Toate câmpurile sunt obligatorii" }, { status: 422 });
  }

  const service = await createServiceClient();

  // Creare cont în Supabase Auth
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password: parola_temporara,
    email_confirm: true, // confirmare automată, fără email de verificare
  });

  if (authError) {
    // Mesaj mai clar pentru email deja existent
    if (authError.message.includes("already")) {
      return NextResponse.json(
        { error: "Există deja un cont cu această adresă de email." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Upsert profil în public.users (trigger-ul poate crea deja un rând gol)
  const { error: profileError } = await service
    .from("users")
    .upsert({
      id: authData.user.id,
      email,
      full_name,
      role,
      is_coordinator: false,
      is_active: true,
    } as never);

  if (profileError) {
    // Rollback: șterge userul din Auth dacă profilul nu s-a creat
    await service.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: "Eroare la crearea profilului. Încearcă din nou." }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: authData.user.id }, { status: 201 });
}

// Tipul utilizator (folosit și în componente)
export type Utilizator = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_coordinator: boolean;
  is_active: boolean;
  created_at: string;
};
