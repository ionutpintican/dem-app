import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";

// Inițializare lazy: constructorul Resend aruncă dacă lipsește cheia, iar la
// nivel de modul asta rupe build-ul (next build evaluează modulele rutelor)
// chiar dacă emailul nu e folosit. Cheia e cerută doar la prima trimitere.
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY lipsește din variabilele de mediu");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// În development folosim onboarding@resend.dev (nu necesită domeniu verificat).
// În producție setează RESEND_FROM_EMAIL=noreply@domeniu-tau.ro în Vercel env vars.
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Decizia Oncologică <onboarding@resend.dev>";

export type EmailKind = "decizie" | "confirmare_pacient" | "feedback";

// Erori Resend care nu merită retry (cererea e greșită, nu serviciul)
const ERORI_PERMANENTE = new Set([
  "validation_error",
  "missing_required_field",
  "invalid_idempotency_key",
  "invalid_from_address",
  "invalid_to_address",
  "missing_api_key",
  "invalid_api_key",
  "restricted_api_key",
  "testing_emails_restriction",
  "daily_quota_exceeded",
]);

const PAUZE_RETRY_MS = [500, 1500];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Logging best-effort în email_log: dacă tabela lipsește (migrarea 003
// neaplicată) sau insert-ul eșuează, emailul tot se trimite.
async function logEmail(intrare: {
  to_email: string;
  subject: string;
  kind: EmailKind;
  case_id: string | null;
}): Promise<string | null> {
  try {
    const service = createServiceClient();
    const { data } = await service
      .from("email_log")
      .insert({ ...intrare, status: "pending" } as never)
      .select("id")
      .single() as unknown as { data: { id: string } | null; error: unknown };
    return data?.id ?? null;
  } catch (err) {
    console.error("email_log insert eșuat (non-blocking):", err);
    return null;
  }
}

async function actualizeazaLog(
  logId: string | null,
  campuri: { status: "sent" | "failed"; sent_at?: string; error_message?: string }
) {
  if (!logId) return;
  try {
    const service = createServiceClient();
    await service.from("email_log").update(campuri as never).eq("id", logId);
  } catch (err) {
    console.error("email_log update eșuat (non-blocking):", err);
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  kind,
  caseId,
}: {
  to: string | string[];
  subject: string;
  html: string;
  kind?: EmailKind;
  caseId?: string;
}) {
  const logId = kind
    ? await logEmail({
        to_email: Array.isArray(to) ? to.join(", ") : to,
        subject,
        kind,
        case_id: caseId ?? null,
      })
    : null;

  let ultimaEroare: Error | null = null;

  for (let incercare = 0; incercare <= PAUZE_RETRY_MS.length; incercare++) {
    try {
      const { data, error } = await getResend().emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });

      if (error) {
        ultimaEroare = new Error(error.message);
        // 4xx (cerere invalidă) — retry-ul nu ajută
        if (ERORI_PERMANENTE.has(error.name)) break;
      } else {
        await actualizeazaLog(logId, {
          status: "sent",
          sent_at: new Date().toISOString(),
        });
        return data;
      }
    } catch (err) {
      // Excepție de rețea / timeout — tranzitorie, merită retry
      ultimaEroare = err instanceof Error ? err : new Error(String(err));
    }

    if (incercare < PAUZE_RETRY_MS.length) {
      await sleep(PAUZE_RETRY_MS[incercare]);
    }
  }

  await actualizeazaLog(logId, {
    status: "failed",
    error_message: ultimaEroare?.message ?? "necunoscut",
  });
  throw ultimaEroare ?? new Error("Eroare necunoscută la trimiterea emailului");
}
