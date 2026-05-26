import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";

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

  // ─── 1. Validare câmpuri ────────────────────────────────────────────────────
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

  const { nume, prenume, email, dataNasterii, telefon, descriere } = result.data;
  const numePacient = `${prenume} ${nume}`;
  const fisiere = formData.getAll("fisiere") as File[];

  const service = createServiceClient();

  // ─── 2. Inserare caz în DB ──────────────────────────────────────────────────
  const { data: caz, error: cazError } = await service
    .from("cases")
    .insert({
      patient_name: numePacient,
      patient_email: email,
      patient_dob: dataNasterii,
      patient_phone: telefon ?? null,
      description: descriere,
      status: "nou",
    } as never)
    .select("id")
    .single() as unknown as { data: { id: string } | null; error: unknown };

  if (cazError || !caz) {
    console.error("Eroare inserare caz:", cazError);
    return NextResponse.json(
      { error: "Eroare la înregistrarea cazului. Încearcă din nou." },
      { status: 500 }
    );
  }

  const cazId = caz.id;

  // ─── 3. Upload fișiere în Supabase Storage ──────────────────────────────────
  const CATEGORII_VALIDE = ["ct", "rmn", "ecografie", "radiografie", "biopsie", "analize", "scrisoare", "altele"];
  const fisiereIncarcate: { name: string; path: string; size: number; category: string }[] = [];

  for (let i = 0; i < fisiere.length; i++) {
    const fisier = fisiere[i];
    if (fisier.size === 0) continue;

    const categorieRaw = (formData.get(`categorie_${i}`) as string) ?? "altele";
    const categorie = CATEGORII_VALIDE.includes(categorieRaw) ? categorieRaw : "altele";

    const extensie = fisier.name.split(".").pop() ?? "";
    const numeFisier = `${Date.now()}_${fisier.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const caleStorage = `${cazId}/${numeFisier}`;

    const buffer = await fisier.arrayBuffer();

    const { error: uploadError } = await service.storage
      .from("medical-files")
      .upload(caleStorage, buffer, {
        contentType: fisier.type || `application/${extensie}`,
        upsert: false,
      });

    if (uploadError) {
      console.error(`Eroare upload ${fisier.name}:`, uploadError.message);
      // Continuăm — nu blocăm cazul dacă un fișier eșuează
      continue;
    }

    fisiereIncarcate.push({
      name: fisier.name,
      path: caleStorage,
      size: fisier.size,
      category: categorie,
    });
  }

  // ─── 4. Inserare înregistrări fișiere în DB ─────────────────────────────────
  if (fisiereIncarcate.length > 0) {
    const randuriFisiere = fisiereIncarcate.map((f) => ({
      case_id: cazId,
      file_name: f.name,
      file_path: f.path,
      file_size: f.size,
      category: f.category,
    }));

    const { error: fisierError } = await service
      .from("case_files")
      .insert(randuriFisiere as never);

    if (fisierError) {
      console.error("Eroare inserare fișiere:", fisierError);
      // Nu blocăm — cazul e creat, fișierele pot fi adăugate manual
    }
  }

  // ─── 5. Audit log ───────────────────────────────────────────────────────────
  try {
    await service
      .from("audit_logs")
      .insert({
        action: "create",
        resource_type: "cases",
        resource_id: cazId,
        case_id: cazId,
        notes: `Caz nou trimis de pacient: ${numePacient}`,
      } as never);
  } catch {
    // ignorăm eroarea de audit — nu blocăm fluxul principal
  }

  // ─── 6. Email confirmare pacient ─────────────────────────────────────────────
  try {
    await sendEmail({
      to: email,
      subject: `Cerere înregistrată — ID: ${cazId.slice(0, 8).toUpperCase()}`,
      html: emailConfirmarePacient({ numePacient, cazId, descriere }),
    });
  } catch (emailError) {
    console.error("Eroare trimitere email confirmare:", emailError);
    // Nu blocăm — cazul e creat chiar dacă emailul eșuează
  }

  return NextResponse.json({ success: true, cazId }, { status: 201 });
}

// ─── Template email confirmare ────────────────────────────────────────────────
function emailConfirmarePacient({
  numePacient,
  cazId,
  descriere,
}: {
  numePacient: string;
  cazId: string;
  descriere: string;
}) {
  const idScurt = cazId.slice(0, 8).toUpperCase();
  const descrierePrescurtata =
    descriere.length > 200 ? descriere.slice(0, 200) + "..." : descriere;

  return `
<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Header -->
        <tr>
          <td style="background:#15803d;padding:32px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:12px;padding:10px 22px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">Decizia Oncologică</span>
            </div>
            <p style="color:#bbf7d0;margin:16px 0 0;font-size:13px;letter-spacing:0.5px;">Institutul Oncologic „Prof. Dr. Ion Chiricuță" Cluj-Napoca</p>
          </td>
        </tr>

        <!-- Conținut -->
        <tr>
          <td style="padding:40px 32px;">
            <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Cererea ta a fost înregistrată</h1>
            <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Bună ziua, <strong>${numePacient}</strong>.</p>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
              Echipa medicală a primit cererea ta și o va analiza în cel mai scurt timp.
              Vei primi decizia echipei pe această adresă de email.
            </p>

            <!-- ID caz -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
              <p style="margin:0 0 4px;color:#15803d;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">ID cerere</p>
              <p style="margin:0;color:#14532d;font-size:28px;font-weight:700;letter-spacing:3px;font-family:monospace;">${idScurt}</p>
              <p style="margin:8px 0 0;color:#86efac;font-size:11px;">Păstrează acest cod pentru referință</p>
            </div>

            <!-- Rezumat -->
            <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Rezumat cerere</p>
              <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">${descrierePrescurtata}</p>
            </div>

            <!-- Pași următori -->
            <p style="margin:0 0 12px;color:#0f172a;font-size:15px;font-weight:600;">Ce urmează?</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${["Echipa medicală analizează cererea ta.", "Fiecare specialist adaugă evaluarea sa.", "Coordonatorul compilează decizia finală și ți-o trimite pe email."].map((pas, i) => `
              <tr>
                <td style="padding:8px 0;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="width:28px;height:28px;background:#dcfce7;border-radius:50%;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#15803d;">${i + 1}</td>
                    <td style="padding-left:12px;color:#475569;font-size:14px;line-height:1.5;">${pas}</td>
                  </tr></table>
                </td>
              </tr>`).join("")}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
              Acest email a fost trimis automat. Te rugăm să nu răspunzi la acest mesaj.<br>
              Datele tale sunt protejate conform <strong>Regulamentului UE 679/2016 (GDPR)</strong>.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
