import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  nume: z.string().min(2),
  prenume: z.string().min(2),
  email: z.string().email(),
  dataNasterii: z.string().min(1),
  telefon: z.string().optional(),
  descriere: z.string().min(20),
  gdpr: z.string(),
});

export async function POST(request: Request) {
  const formData = await request.formData();

  const fields = {
    nume: formData.get("nume"),
    prenume: formData.get("prenume"),
    email: formData.get("email"),
    dataNasterii: formData.get("dataNasterii"),
    telefon: formData.get("telefon") ?? undefined,
    descriere: formData.get("descriere"),
    gdpr: formData.get("gdpr"),
  };

  const result = schema.safeParse(fields);
  if (!result.success) {
    return NextResponse.json(
      { error: "Date invalide", detalii: result.error.flatten() },
      { status: 422 }
    );
  }

  if (result.data.gdpr !== "true") {
    return NextResponse.json(
      { error: "Consimțământul GDPR este obligatoriu" },
      { status: 422 }
    );
  }

  const fisiere = formData.getAll("fisiere") as File[];

  // TODO: salvare în Supabase + trimitere email confirmare via Resend
  console.log("Cerere nouă:", {
    ...result.data,
    fisiere: fisiere.map((f) => ({ name: f.name, size: f.size, type: f.type })),
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
