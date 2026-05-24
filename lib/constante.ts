export const ROLURI_OBLIGATORII = [
  "radiolog",
  "oncolog",
  "chirurg_oncolog",
  "chirurg_plastician",
  "radioterapeut",
  "genetician",
] as const;

export const TOTAL_OBLIGATORII = ROLURI_OBLIGATORII.length; // 6

export const STATUS_CONFIG: Record<
  string,
  { eticheta: string; culoare: string; punct: string }
> = {
  nou: {
    eticheta: "Nou",
    culoare: "bg-blue-100 text-blue-700",
    punct: "bg-blue-500",
  },
  in_lucru: {
    eticheta: "În lucru",
    culoare: "bg-amber-100 text-amber-700",
    punct: "bg-amber-500",
  },
  gata_expediere: {
    eticheta: "Gata de expediere",
    culoare: "bg-orange-100 text-orange-700",
    punct: "bg-orange-500",
  },
  trimis: {
    eticheta: "Trimis",
    culoare: "bg-green-100 text-green-700",
    punct: "bg-green-500",
  },
  arhivat: {
    eticheta: "Arhivat",
    culoare: "bg-slate-100 text-slate-500",
    punct: "bg-slate-400",
  },
};
