export const ROLURI_MEDICALE = [
  { valoare: "radiolog", eticheta: "Radiolog" },
  { valoare: "oncolog", eticheta: "Oncolog" },
  { valoare: "chirurg_oncolog", eticheta: "Chirurg Oncolog" },
  { valoare: "chirurg_plastician", eticheta: "Chirurg Plastician" },
  { valoare: "radioterapeut", eticheta: "Radioterapeut" },
  { valoare: "genetician", eticheta: "Genetician" },
  { valoare: "psiholog", eticheta: "Psiholog" },
  { valoare: "nutritionist", eticheta: "Nutriționist" },
] as const;

export type RolMedical = (typeof ROLURI_MEDICALE)[number]["valoare"];

export const ETICHETA_ROL: Record<string, string> = {
  radiolog: "Radiolog",
  oncolog: "Oncolog",
  chirurg_oncolog: "Chirurg Oncolog",
  chirurg_plastician: "Chirurg Plastician",
  radioterapeut: "Radioterapeut",
  genetician: "Genetician",
  psiholog: "Psiholog",
  nutritionist: "Nutriționist",
  admin: "Administrator",
};

export const CULORI_ROL: Record<string, string> = {
  radiolog: "bg-purple-100 text-purple-700",
  oncolog: "bg-red-100 text-red-700",
  chirurg_oncolog: "bg-orange-100 text-orange-700",
  chirurg_plastician: "bg-pink-100 text-pink-700",
  radioterapeut: "bg-yellow-100 text-yellow-700",
  genetician: "bg-teal-100 text-teal-700",
  psiholog: "bg-blue-100 text-blue-700",
  nutritionist: "bg-green-100 text-green-700",
  admin: "bg-slate-100 text-slate-700",
};
