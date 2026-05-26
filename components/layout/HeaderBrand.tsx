import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  marime?: "mic" | "normal";
};

export default function HeaderBrand({ href = "/", marime = "normal" }: Props) {
  const dimensiuneLogo = marime === "mic" ? 32 : 40;
  const titluClass = marime === "mic" ? "text-base" : "text-lg";
  const subtitluClass = marime === "mic" ? "text-[10px]" : "text-xs";

  const continut = (
    <div className="flex items-center gap-2.5">
      <Image
        src="/iocn-logo.png"
        alt="Institutul Oncologic Prof. Dr. Ion Chiricuță Cluj-Napoca"
        width={dimensiuneLogo * 2}
        height={dimensiuneLogo}
        className="object-contain"
        style={{ height: dimensiuneLogo, width: "auto" }}
        priority
      />
      <div className="hidden sm:flex flex-col leading-tight border-l border-slate-200 pl-2.5">
        <span className={`${titluClass} font-bold text-green-800`}>
          Decizia Oncologică
        </span>
        <span className={`${subtitluClass} text-slate-500`}>
          Platformă IOCN Cluj-Napoca
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {continut}
      </Link>
    );
  }

  return continut;
}
