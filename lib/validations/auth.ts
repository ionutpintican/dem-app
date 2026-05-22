import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Adresa de email este obligatorie")
    .email("Adresă de email invalidă"),
  password: z
    .string()
    .min(6, "Parola trebuie să aibă cel puțin 6 caractere"),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Adresa de email este obligatorie")
      .email("Adresă de email invalidă"),
    password: z
      .string()
      .min(8, "Parola trebuie să aibă cel puțin 8 caractere")
      .regex(/[A-Z]/, "Parola trebuie să conțină cel puțin o literă mare")
      .regex(/[0-9]/, "Parola trebuie să conțină cel puțin o cifră"),
    confirmPassword: z.string().min(1, "Confirmarea parolei este obligatorie"),
    fullName: z
      .string()
      .min(2, "Numele trebuie să aibă cel puțin 2 caractere"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parolele nu coincid",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
