// Layout comun pentru toate emailurile platformei (spec 011).
// Conținutul (`continut`) este HTML deja escapat de apelant.

const FOOTER_IMPLICIT =
  "Trimis automat din platforma Decizia Oncologică";

export const FOOTER_GDPR = `Acest email a fost trimis automat. Te rugăm să nu răspunzi la acest mesaj.<br>
Datele tale sunt protejate conform <strong>Regulamentului UE 679/2016 (GDPR)</strong>.`;

export function renderEmailTemplate({
  titluHeader = "Decizia Oncologică",
  subtitluHeader,
  continut,
  footerHtml,
  latimeMax = 560,
}: {
  titluHeader?: string;
  subtitluHeader?: string;
  continut: string;
  footerHtml?: string;
  latimeMax?: number;
}): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="max-width:${latimeMax}px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Header -->
        <tr>
          <td style="background:#f43f5e;padding:32px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:12px;padding:10px 22px;${subtitluHeader ? "margin-bottom:12px;" : ""}">
              <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">${titluHeader}</span>
            </div>
            ${subtitluHeader ? `
            <p style="color:#fce7f3;margin:0;font-size:12px;letter-spacing:1px;line-height:1.6;">
              ${subtitluHeader}
            </p>` : ""}
          </td>
        </tr>

        <!-- Conținut -->
        ${continut}

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.8;">
              ${footerHtml ?? FOOTER_IMPLICIT}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
