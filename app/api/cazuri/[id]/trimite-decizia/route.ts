import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { ETICHETA_ROL } from "@/lib/roluri";
import { renderEmailTemplate, escapeHtml, FOOTER_GDPR } from "@/lib/email/template";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const cazId = params.id;
  const service = createServiceClient();

  // Verifică că utilizatorul este coordonator activ
  const { data: profil } = await service
    .from("users")
    .select("full_name, role, is_coordinator, is_active")
    .eq("id", user.id)
    .single() as unknown as {
      data: { full_name: string | null; role: string; is_coordinator: boolean; is_active: boolean } | null;
      error: unknown;
    };

  if (!profil?.is_active) {
    return NextResponse.json({ error: "Cont inactiv" }, { status: 403 });
  }
  if (!profil?.is_coordinator) {
    return NextResponse.json(
      { error: "Doar coordonatorii pot trimite decizia" },
      { status: 403 }
    );
  }

  // Preia cazul
  const { data: caz } = await service
    .from("cases")
    .select("id, patient_name, patient_email, status, created_at")
    .eq("id", cazId)
    .single() as unknown as {
      data: {
        id: string;
        patient_name: string;
        patient_email: string;
        status: string;
        created_at: string;
      } | null;
      error: unknown;
    };

  if (!caz) return NextResponse.json({ error: "Caz negăsit" }, { status: 404 });

  if (caz.status === "trimis") {
    return NextResponse.json({ error: "Decizia a fost deja trimisă" }, { status: 409 });
  }
  if (caz.status === "arhivat") {
    return NextResponse.json({ error: "Cazul este arhivat" }, { status: 409 });
  }

  // Preia toate inputurile
  const { data: inputuri } = await service
    .from("specialist_inputs")
    .select("role_at_time, content, is_coordinator_conclusion, created_at")
    .eq("case_id", cazId)
    .order("created_at", { ascending: true }) as unknown as {
      data: {
        role_at_time: string;
        content: Record<string, string>;
        is_coordinator_conclusion: boolean;
        created_at: string;
      }[] | null;
      error: unknown;
    };

  // Extrage concluzia coordonatorului
  const concluzieCoord = (inputuri ?? []).find((i) => i.is_coordinator_conclusion);
  if (!concluzieCoord) {
    return NextResponse.json(
      { error: "Concluzia coordonatorului lipsește — adaugă-o înainte de trimitere" },
      { status: 422 }
    );
  }

  const inputuriSpecialisti = (inputuri ?? []).filter((i) => !i.is_coordinator_conclusion);

  // Compare-and-swap ÎNAINTE de email: marchează cazul ca trimis doar dacă nu e
  // deja trimis/arhivat. Blochează trimiterea dublă (dublu-click, două taburi).
  const { data: cazBlocat } = await service
    .from("cases")
    .update({
      status: "trimis",
      decision_sent_at: new Date().toISOString(),
      sent_by: user.id,
    } as never)
    .eq("id", cazId)
    .not("status", "in", '("trimis","arhivat")')
    .select("id") as unknown as { data: { id: string }[] | null; error: unknown };

  if (!cazBlocat || cazBlocat.length === 0) {
    return NextResponse.json({ error: "Decizia a fost deja trimisă" }, { status: 409 });
  }

  // Trimite emailul
  try {
    await sendEmail({
      to: caz.patient_email,
      subject: `Decizia echipei multidisciplinare — ${caz.patient_name}`,
      html: emailDecizieFinala({
        cazId: caz.id,
        pacientName: caz.patient_name,
        decizieFinala: concluzieCoord.content.decizie_finala ?? "",
        recomandari: concluzieCoord.content.recomandari ?? "",
        inputuriSpecialisti,
        coordonatorName: profil.full_name ?? "Coordonatorul echipei",
        dataTrimitere: new Date().toLocaleDateString("ro-RO", {
          day: "numeric", month: "long", year: "numeric",
        }),
      }),
      kind: "decizie",
      caseId: caz.id,
    });
  } catch (emailError) {
    console.error("Eroare trimitere email decizie:", emailError);
    // Rollback compensator: emailul nu a plecat, restaurăm statusul anterior
    await service
      .from("cases")
      .update({
        status: caz.status,
        decision_sent_at: null,
        sent_by: null,
      } as never)
      .eq("id", cazId);
    return NextResponse.json(
      { error: "Eroare la trimiterea emailului. Încearcă din nou." },
      { status: 500 }
    );
  }

  // Audit log
  try {
    // "status_change" + notes — enum-ul audit_action din DB nu are "send_decision"
    // (insert-ul eșua silențios); după migrarea 002 se poate trece pe valoarea dedicată
    await service.from("audit_logs").insert({
      user_id: user.id,
      action: "status_change",
      resource_type: "cases",
      resource_id: cazId,
      case_id: cazId,
      notes: `Decizie finală trimisă pacientului ${caz.patient_name} (${caz.patient_email})`,
    } as never);
  } catch { /* ignorăm */ }

  // sent: true = emailul a plecat efectiv către Resend ȘI statusul e actualizat
  return NextResponse.json({ success: true, sent: true }, { status: 200 });
}

// ─── Template email decizie finală ───────────────────────────────────────────

function emailDecizieFinala({
  cazId,
  pacientName,
  decizieFinala,
  recomandari,
  inputuriSpecialisti,
  coordonatorName,
  dataTrimitere,
}: {
  cazId: string;
  pacientName: string;
  decizieFinala: string;
  recomandari: string;
  inputuriSpecialisti: { role_at_time: string; content: Record<string, string> }[];
  coordonatorName: string;
  dataTrimitere: string;
}) {
  const idScurt = cazId.slice(0, 8).toUpperCase();

  const randSpecialist = (rol: string, concluzie: string) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;">
        <span style="font-size:12px;font-weight:600;color:#475569;">${ETICHETA_ROL[rol] ?? rol}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;">
        <p style="margin:0;font-size:13px;color:#334155;line-height:1.6;">${concluzie ? escapeHtml(concluzie) : "—"}</p>
      </td>
    </tr>`;

  const tablaSpecialisti = inputuriSpecialisti
    .map((i) => randSpecialist(i.role_at_time, i.content.concluzie ?? ""))
    .join("");

  const continut = `
        <!-- Intro -->
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0f172a;">
              Stimate/ă ${escapeHtml(pacientName)},
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7;">
              Echipa medicală multidisciplinară a finalizat evaluarea cazului dumneavoastră
              și vă transmite decizia colectivă. Documentul a fost elaborat de
              <strong>${escapeHtml(coordonatorName)}</strong> în data de <strong>${dataTrimitere}</strong>.
            </p>

            <!-- ID caz -->
            <div style="background:#fdf2f8;border:1px solid #fce7f3;border-radius:10px;
              padding:12px 16px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
              <span style="font-size:11px;font-weight:600;color:#f43f5e;text-transform:uppercase;
                letter-spacing:1px;">ID dosar:</span>
              <span style="font-size:15px;font-weight:700;color:#9f1239;
                font-family:monospace;letter-spacing:2px;">${idScurt}</span>
            </div>
          </td>
        </tr>

        <!-- Decizia finală -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#fdf2f8;border:2px solid #fce7f3;border-radius:12px;padding:20px 24px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#f43f5e;
                text-transform:uppercase;letter-spacing:1px;">
                ✓ Decizia echipei
              </p>
              <p style="margin:0;font-size:15px;color:#9f1239;line-height:1.8;white-space:pre-wrap;">${escapeHtml(decizieFinala)}</p>
            </div>
          </td>
        </tr>

        ${recomandari ? `
        <!-- Recomandări -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:18px 22px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#92400e;
                text-transform:uppercase;letter-spacing:1px;">Recomandări</p>
              <p style="margin:0;font-size:14px;color:#78350f;line-height:1.8;white-space:pre-wrap;">${escapeHtml(recomandari)}</p>
            </div>
          </td>
        </tr>` : ""}

        ${tablaSpecialisti ? `
        <!-- Evaluări specialiști -->
        <tr>
          <td style="padding:0 32px 24px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0f172a;">
              Concluziile specialiștilor
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-size:13px;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="text-align:left;padding:10px 12px;font-size:11px;
                    font-weight:600;color:#64748b;text-transform:uppercase;
                    letter-spacing:0.5px;width:160px;border-bottom:1px solid #e2e8f0;">
                    Specialitate
                  </th>
                  <th style="text-align:left;padding:10px 12px;font-size:11px;
                    font-weight:600;color:#64748b;text-transform:uppercase;
                    letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;">
                    Concluzie
                  </th>
                </tr>
              </thead>
              <tbody>${tablaSpecialisti}</tbody>
            </table>
          </td>
        </tr>` : ""}`;

  return renderEmailTemplate({
    subtitluHeader: "DECIZIA ECHIPEI MULTIDISCIPLINARE",
    continut,
    footerHtml: FOOTER_GDPR,
    latimeMax: 600,
  });
}
