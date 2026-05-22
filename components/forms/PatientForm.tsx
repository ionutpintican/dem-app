"use client";

import { useState, useRef } from "react";
import { z } from "zod";

const patientSchema = z.object({
  nume: z.string().min(2, "Numele trebuie să aibă cel puțin 2 caractere"),
  prenume: z.string().min(2, "Prenumele trebuie să aibă cel puțin 2 caractere"),
  email: z.string().email("Adresă de email invalidă"),
  dataNasterii: z.string().min(1, "Data nașterii este obligatorie"),
  telefon: z.string().optional(),
  descriere: z.string().min(20, "Descrierea trebuie să aibă cel puțin 20 de caractere"),
  gdpr: z.literal(true, "Trebuie să îți exprimi consimțământul pentru prelucrarea datelor"),
});

type PatientFormData = z.infer<typeof patientSchema>;
type FieldErrors = Partial<Record<keyof PatientFormData, string>>;

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = [
  "image/jpeg", "image/png", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PatientForm() {
  const [fields, setFields] = useState({
    nume: "",
    prenume: "",
    email: "",
    dataNasterii: "",
    telefon: "",
    descriere: "",
    gdpr: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [fileError, setFileError] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFields((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const selected = Array.from(e.target.files ?? []);
    const invalid = selected.filter((f) => !ACCEPTED_TYPES.includes(f.type));
    const tooBig = selected.filter((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);

    if (invalid.length > 0) {
      setFileError("Tipuri acceptate: JPG, PNG, WEBP, PDF, DOC, DOCX.");
      return;
    }
    if (tooBig.length > 0) {
      setFileError(`Fiecare fișier trebuie să fie sub ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...selected.filter((f) => !names.has(f.name))];
    });
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function fileIcon(mime: string) {
    if (mime.startsWith("image/")) return "🖼";
    if (mime === "application/pdf") return "📄";
    return "📝";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFileError("");

    const result = patientSchema.safeParse({ ...fields, gdpr: fields.gdpr || undefined });
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as keyof PatientFormData;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setStatus("loading");
    try {
      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) => formData.append(k, String(v)));
      files.forEach((f) => formData.append("fisiere", f));

      const res = await fetch("/api/cazuri/nou", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Cerere trimisă cu succes!</h2>
        <p className="text-slate-600 max-w-md mx-auto">
          Am înregistrat cererea ta. Vei primi un email de confirmare în cel mai scurt timp.
          Un specialist îți va contacta în termen de 24–48 de ore.
        </p>
        <button
          onClick={() => { setStatus("idle"); setFields({ nume: "", prenume: "", email: "", dataNasterii: "", telefon: "", descriere: "", gdpr: false }); setFiles([]); }}
          className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          Trimite o altă cerere
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* Nume + Prenume */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nume" className="block text-sm font-medium text-slate-700 mb-1">
            Nume <span className="text-red-500">*</span>
          </label>
          <input
            id="nume"
            name="nume"
            type="text"
            autoComplete="family-name"
            value={fields.nume}
            onChange={handleChange}
            placeholder="Popescu"
            className={`w-full px-4 py-2.5 rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
              errors.nume
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-slate-300 focus:ring-blue-300 focus:border-blue-400"
            }`}
          />
          {errors.nume && <p className="mt-1 text-xs text-red-600">{errors.nume}</p>}
        </div>

        <div>
          <label htmlFor="prenume" className="block text-sm font-medium text-slate-700 mb-1">
            Prenume <span className="text-red-500">*</span>
          </label>
          <input
            id="prenume"
            name="prenume"
            type="text"
            autoComplete="given-name"
            value={fields.prenume}
            onChange={handleChange}
            placeholder="Ion"
            className={`w-full px-4 py-2.5 rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
              errors.prenume
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-slate-300 focus:ring-blue-300 focus:border-blue-400"
            }`}
          />
          {errors.prenume && <p className="mt-1 text-xs text-red-600">{errors.prenume}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Adresă de email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={handleChange}
          placeholder="ion.popescu@exemplu.ro"
          className={`w-full px-4 py-2.5 rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
            errors.email
              ? "border-red-400 focus:ring-red-300 bg-red-50"
              : "border-slate-300 focus:ring-blue-300 focus:border-blue-400"
          }`}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      {/* Data nașterii + Telefon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dataNasterii" className="block text-sm font-medium text-slate-700 mb-1">
            Data nașterii <span className="text-red-500">*</span>
          </label>
          <input
            id="dataNasterii"
            name="dataNasterii"
            type="date"
            value={fields.dataNasterii}
            onChange={handleChange}
            max={new Date().toISOString().split("T")[0]}
            className={`w-full px-4 py-2.5 rounded-lg border text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
              errors.dataNasterii
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-slate-300 focus:ring-blue-300 focus:border-blue-400"
            }`}
          />
          {errors.dataNasterii && <p className="mt-1 text-xs text-red-600">{errors.dataNasterii}</p>}
        </div>

        <div>
          <label htmlFor="telefon" className="block text-sm font-medium text-slate-700 mb-1">
            Telefon <span className="text-slate-400 font-normal">(opțional)</span>
          </label>
          <input
            id="telefon"
            name="telefon"
            type="tel"
            autoComplete="tel"
            value={fields.telefon}
            onChange={handleChange}
            placeholder="07xx xxx xxx"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
          />
        </div>
      </div>

      {/* Descriere caz */}
      <div>
        <label htmlFor="descriere" className="block text-sm font-medium text-slate-700 mb-1">
          Descrierea cazului <span className="text-red-500">*</span>
        </label>
        <textarea
          id="descriere"
          name="descriere"
          rows={5}
          value={fields.descriere}
          onChange={handleChange}
          placeholder="Descrieți pe scurt situația medicală, simptomele și istoricul relevant..."
          className={`w-full px-4 py-2.5 rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors resize-none ${
            errors.descriere
              ? "border-red-400 focus:ring-red-300 bg-red-50"
              : "border-slate-300 focus:ring-blue-300 focus:border-blue-400"
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.descriere
            ? <p className="text-xs text-red-600">{errors.descriere}</p>
            : <span />
          }
          <span className={`text-xs ml-auto ${fields.descriere.length < 20 ? "text-slate-400" : "text-green-600"}`}>
            {fields.descriere.length} / 20 min.
          </span>
        </div>
      </div>

      {/* Upload fișiere */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Documente medicale <span className="text-slate-400 font-normal">(opțional)</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dt = e.dataTransfer;
            if (dt.files.length) {
              const synth = { target: { files: dt.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleFiles(synth);
            }
          }}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <svg className="mx-auto mb-2 w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <p className="text-sm text-slate-600">
            <span className="font-medium text-blue-600">Selectează fișiere</span> sau trage aici
          </p>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP, PDF, DOC, DOCX — max. {MAX_FILE_SIZE_MB} MB per fișier</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleFiles}
          />
        </div>
        {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}

        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((f) => (
              <li key={f.name} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-slate-700 truncate">
                  <span>{fileIcon(f.type)}</span>
                  <span className="truncate max-w-[220px]">{f.name}</span>
                  <span className="text-slate-400 shrink-0">({formatBytes(f.size)})</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(f.name)}
                  className="ml-2 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Elimină fișier"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* GDPR */}
      <div className={`rounded-xl border p-4 ${errors.gdpr ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            name="gdpr"
            type="checkbox"
            checked={fields.gdpr}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-300 shrink-0"
          />
          <span className="text-sm text-slate-700 leading-relaxed">
            <span className="font-medium">Consimțământ prelucrare date cu caracter personal</span>
            {" — "}
            Sunt de acord ca datele mele personale, inclusiv datele medicale furnizate, să fie prelucrate de echipa DEM în scopul analizării și soluționării cererii mele, în conformitate cu{" "}
            <span className="text-blue-600 font-medium">Regulamentul UE 679/2016 (GDPR)</span>.
            Înțeleg că am dreptul de acces, rectificare și ștergere a datelor.
            <span className="text-red-500 ml-1">*</span>
          </span>
        </label>
        {errors.gdpr && <p className="mt-2 text-xs text-red-600 pl-7">{errors.gdpr}</p>}
      </div>

      {/* Eroare server */}
      {status === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          A apărut o eroare la trimiterea cererii. Te rugăm să încerci din nou sau să ne contactezi direct.
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        {status === "loading" ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Se trimite...
          </span>
        ) : (
          "Trimite cererea"
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        Câmpurile marcate cu <span className="text-red-500">*</span> sunt obligatorii.
      </p>
    </form>
  );
}
