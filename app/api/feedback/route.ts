import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { ETICHETA_ROL } from "@/lib/roluri";
import { rateLimit } from "@/lib/rate-limit";
import { renderEmailTemplate, escapeHtml } from "@/lib/email/template";

const DEVELOPER_EMAIL = process.env.FEEDBACK_EMAIL ?? "ionut.pintican@gmail.com";
const MAX_MESAJ_LUNGIME = 5000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  // Max 5 mesaje / 10 minute per utilizator
  const { allowed, retryAfterSec } = rateLimit({
    key: `feedback:${user.id}`,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Prea multe mesaje. Încearcă din nou în câteva minute." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  const service = createServiceClient();
  const { data: profil } = await service
    .from("users")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .single() as unknown as {
      data: { full_name: string | null; role: string; is_active: boolean } | null;
      error: unknown;
    };

  if (!profil?.is_active) {
    return NextResponse.json({ error: "Cont inactiv" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corp cerere invalid" }, { status: 400 });
  }

  const mesaj = (body as { mesaj?: unknown }).mesaj;
  if (!mesaj || typeof mesaj !== "string" || !mesaj.trim()) {
    return NextResponse.json({ error: "Mesajul este obligatoriu" }, { status: 422 });
  }
  if (mesaj.length > MAX_MESAJ_LUNGIME) {
    return NextResponse.json(
      { error: `Mesajul depășește ${MAX_MESAJ_LUNGIME} de caractere.` },
      { status: 422 }
    );
  }

  const numeExpeditor = profil.full_name ?? user.email ?? "Utilizator necunoscut";
  const rolExpeditor = ETICHETA_ROL[profil.role] ?? profil.role;
  const data = new Date().toLocaleDateString("ro-RO", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const continut = `
        <tr>
          <td style="padding:28px 32px;">
            <table cellpadding="0" cellspacing="0" width="100%"
              style="background:#f1f5f9;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <tr>
                <td style="font-size:12px;color:#64748b;padding-bottom:4px;">Expeditor</td>
              </tr>
              <tr>
                <td style="font-size:15px;font-weight:600;color:#0f172a;">${escapeHtml(numeExpeditor)}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#475569;padding-top:2px;">${escapeHtml(rolExpeditor)}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#94a3b8;padding-top:8px;">${escapeHtml(data)}</td>
              </tr>
            </table>

            <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#64748b;
              text-transform:uppercase;letter-spacing:1px;">Mesaj</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
              padding:20px 22px;">
              <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.8;white-space:pre-wrap;">${escapeHtml(mesaj.trim())}</p>
            </div>
          </td>
        </tr>`;

  try {
    await sendEmail({
      to: DEVELOPER_EMAIL,
      subject: `[Decizia Oncologică · Feedback] ${numeExpeditor} — ${rolExpeditor}`,
      html: renderEmailTemplate({ subtitluHeader: "FEEDBACK UTILIZATOR", continut }),
      kind: "feedback",
    });
  } catch (emailError) {
    console.error("Eroare trimitere feedback:", emailError);
    return NextResponse.json({ error: "Eroare la trimiterea mesajului. Încearcă din nou." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
