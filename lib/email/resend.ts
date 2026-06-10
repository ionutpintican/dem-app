import { Resend } from "resend";

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

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) throw new Error(error.message);
  return data;
}
