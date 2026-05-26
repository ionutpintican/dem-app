import type { Doctor } from "@/lib/echipa";

export default function CardDoctor({ doctor }: { doctor: Doctor }) {
  const initiale = doctor.nume
    .split(" ")
    .filter((p) => !p.endsWith("."))
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {doctor.imgUrl ? (
        <img
          src={doctor.imgUrl}
          alt={doctor.nume}
          className="w-full aspect-square object-cover object-top"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-square bg-rose-100 flex items-center justify-center">
          <span className="text-rose-400 text-3xl font-bold">{initiale}</span>
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col gap-1">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{doctor.nume}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{doctor.specialitate}</p>
        {doctor.esteCoordonator && (
          <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full w-fit">
            Coordonator
          </span>
        )}
      </div>
    </div>
  );
}
