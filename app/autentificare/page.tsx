"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import HeaderBrand from "@/components/layout/HeaderBrand";
import PasswordInput from "@/components/ui/PasswordInput";

function mapeazaEroare(err: { message?: string; status?: number }): {
  mesaj: string;
  rateLimit: boolean;
} {
  const msg = err.message?.toLowerCase() ?? "";
  if (err.status === 429 || msg.includes("rate limit")) {
    return {
      mesaj: "Prea multe încercări. Așteaptă 60 de secunde înainte de a încerca din nou.",
      rateLimit: true,
    };
  }
  if (msg.includes("email not confirmed")) {
    return {
      mesaj: "Adresa de email nu a fost încă confirmată. Contactează administratorul.",
      rateLimit: false,
    };
  }
  return {
    mesaj: "Email sau parolă incorectă. Verifică datele și încearcă din nou.",
    rateLimit: false,
  };
}

function FormAutentificare() {
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [eroare, setEroare] = useState("");
  const [loading, setLoading] = useState(false);
  const [secundeBlocat, setSecundeBlocat] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const parolaResetata = searchParams.get("resetat") === "1";
  const linkExpirat = searchParams.get("eroare") === "link-expirat";
  const contDezactivat = searchParams.get("eroare") === "cont-dezactivat";

  // Countdown după rate limit — butonul rămâne dezactivat
  useEffect(() => {
    if (secundeBlocat <= 0) return;
    const t = setTimeout(() => setSecundeBlocat((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secundeBlocat]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEroare("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parola,
    });

    if (error) {
      console.error("Eroare autentificare:", error);
      const { mesaj, rateLimit } = mapeazaEroare(error);
      setEroare(mesaj);
      if (rateLimit) setSecundeBlocat(60);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1 text-pretty">Bine ai revenit</h1>
        <p className="text-slate-500 text-sm mb-1">
          Autentificare personal medical și administrativ
        </p>
        <p className="text-slate-400 text-xs mb-8">
          Autentifică-te cu datele primite de la administrator.
        </p>

        {parolaResetata && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-400 mb-5">
            Parola a fost resetată cu succes. Te poți autentifica cu parola nouă.
          </div>
        )}

        {linkExpirat && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 mb-5">
            Link-ul de resetare a expirat sau este invalid.{" "}
            <Link href="/resetare-parola" className="font-medium underline hover:no-underline">
              Solicită unul nou.
            </Link>
          </div>
        )}

        {contDezactivat && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-5">
            Acest cont a fost dezactivat. Contactează administratorul pentru detalii.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Adresă de email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@spital.ro"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:border-rose-400 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="parola" className="block text-sm font-medium text-slate-700">
                Parolă
              </label>
              <Link
                href="/resetare-parola"
                className="text-xs text-rose-400 hover:text-rose-500 transition-colors"
              >
                Ai uitat parola?
              </Link>
            </div>
            <PasswordInput
              id="parola"
              name="password"
              autoComplete="current-password"
              required
              value={parola}
              onChange={(e) => setParola(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:border-rose-400 transition-colors"
            />
          </div>

          {eroare && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {eroare}
              {secundeBlocat > 0 && (
                <span className="block mt-1 font-medium">
                  Poți reîncerca în {secundeBlocat}s.
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !parola || secundeBlocat > 0}
            className="w-full py-2.5 bg-rose-400 text-white rounded-lg font-semibold hover:bg-rose-500 active:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg aria-hidden="true" className="animate-spin motion-reduce:animate-none h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Se verifică…
              </span>
            ) : (
              "Intră în cont"
            )}
          </button>
        </form>
      </div>

      <div className="mt-6">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-500 font-semibold text-sm hover:bg-rose-100 hover:border-rose-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          <svg aria-hidden="true" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Solicită asistență medicală
        </Link>
      </div>
    </>
  );
}

export default function AutentificarePage() {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <HeaderBrand href="/" />
        </div>

        <Suspense fallback={null}>
          <FormAutentificare />
        </Suspense>

      </div>
    </main>
  );
}
