import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { ETICHETA_ROL } from "@/lib/roluri";

const DEVELOPER_EMAIL = "ionut.pintican@gmail.com";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

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
  if (profil.role === "admin") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
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

  const numeExpeditor = profil.full_name ?? user.email ?? "Utilizator necunoscut";
  const rolExpeditor = ETICHETA_ROL[profil.role] ?? profil.role;
  const data = new Date().toLocaleDateString("ro-RO", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  try {
    await sendEmail({
      to: DEVELOPER_EMAIL,
      subject: `[Decizia Oncologică · Feedback] ${numeExpeditor} — ${rolExpeditor}`,
      html: `
<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

        <tr>
          <td style="background:#f43f5e;padding:24px 32px;">
            <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.5px;">Decizia Oncologică</span>
            <span style="color:#fce7f3;font-size:13px;margin-left:12px;">· Feedback utilizator</span>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px 0;">
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
              padding:20px 22px;margin-bottom:28px;">
              <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.8;white-space:pre-wrap;">${escapeHtml(mesaj.trim())}</p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 24px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              Trimis automat din platforma Decizia Oncologică
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
  } catch (emailError) {
    console.error("Eroare trimitere feedback:", emailError);
    return NextResponse.json({ error: "Eroare la trimiterea mesajului. Încearcă din nou." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
