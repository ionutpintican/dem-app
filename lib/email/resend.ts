import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// În development folosim onboarding@resend.dev (nu necesită domeniu verificat).
// În producție setează RESEND_FROM_EMAIL=noreply@domeniu-tau.ro în Vercel env vars.
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "DEM <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) throw new Error(error.message);
  return data;
}
