export default function FundalDecorativ() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        fill="none"
      >
        <defs>
          <linearGradient id="fundal-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dcfce7" />
            <stop offset="100%" stopColor="#f0fdf4" />
          </linearGradient>
        </defs>

        {/* Bază pal verde */}
        <rect width="1440" height="900" fill="url(#fundal-gradient)" />

        {/* Dungi curbate verzi transparente */}
        <g stroke="#15803d" strokeWidth="2" fill="none" opacity="0.08">
          <path d="M -200 200 Q 400 50 900 250 T 1700 200" />
          <path d="M -200 350 Q 400 200 900 400 T 1700 350" />
          <path d="M -200 500 Q 400 350 900 550 T 1700 500" />
          <path d="M -200 650 Q 400 500 900 700 T 1700 650" />
          <path d="M -200 800 Q 400 650 900 850 T 1700 800" />
        </g>

        <g stroke="#16a34a" strokeWidth="3" fill="none" opacity="0.06">
          <path d="M -200 100 Q 500 -50 1000 150 T 1800 100" />
          <path d="M -200 450 Q 500 300 1000 500 T 1800 450" />
          <path d="M -200 750 Q 500 600 1000 800 T 1800 750" />
        </g>

        {/* Curbe largi de accent */}
        <g stroke="#15803d" strokeWidth="1.5" fill="none" opacity="0.05">
          <path d="M 0 0 Q 720 600 1440 0" />
          <path d="M 0 900 Q 720 300 1440 900" />
        </g>
      </svg>
    </div>
  );
}
