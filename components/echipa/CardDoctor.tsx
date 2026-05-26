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
    <div className="group bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-rose-100/50 hover:border-rose-200/60">
      {doctor.imgUrl ? (
        <img
          src={doctor.imgUrl}
          alt={doctor.nume}
          width={320}
          height={320}
          className="w-full aspect-square object-cover object-top"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-square bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
          <span className="text-rose-400 text-3xl font-bold tracking-tight">{initiale}</span>
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col gap-1">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{doctor.nume}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{doctor.specialitate}</p>
        {doctor.esteCoordonator && (
          <span className="mt-1.5 inline-block text-[10px] font-semibold uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full w-fit">
            Coordonator
          </span>
        )}
      </div>
    </div>
  );
}
