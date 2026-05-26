import Link from "next/link";

type Props = {
  href?: string;
};

export default function HeaderBrand({ href = "/" }: Props) {
  const continut = (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-full bg-rose-400 flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-sm tracking-tight">DO</span>
      </div>
      <span className="hidden sm:inline font-bold text-rose-600 text-lg">
        Decizia Oncologică
      </span>
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
