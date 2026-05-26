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
          <linearGradient id="fundal-gradient" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#fff0f4" />
            <stop offset="55%" stopColor="#fdf2f8" />
            <stop offset="100%" stopColor="#fef9fb" />
          </linearGradient>
          <radialGradient id="glow-top" cx="50%" cy="-5%" r="65%">
            <stop offset="0%" stopColor="#fda4af" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fce7f3" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-bottom" cx="80%" cy="110%" r="50%">
            <stop offset="0%" stopColor="#fecdd3" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#fce7f3" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1440" height="900" fill="url(#fundal-gradient)" />
        <rect width="1440" height="900" fill="url(#glow-top)" />
        <rect width="1440" height="900" fill="url(#glow-bottom)" />

        {/* Fine waves */}
        <g stroke="#f43f5e" strokeWidth="1.5" fill="none" opacity="0.07">
          <path d="M -200 200 Q 400 50 900 250 T 1700 200" />
          <path d="M -200 350 Q 400 200 900 400 T 1700 350" />
          <path d="M -200 500 Q 400 350 900 550 T 1700 500" />
          <path d="M -200 650 Q 400 500 900 700 T 1700 650" />
          <path d="M -200 800 Q 400 650 900 850 T 1700 800" />
        </g>

        {/* Bold accent waves */}
        <g stroke="#f43f5e" strokeWidth="2.5" fill="none" opacity="0.055">
          <path d="M -200 100 Q 500 -50 1000 150 T 1800 100" />
          <path d="M -200 450 Q 500 300 1000 500 T 1800 450" />
          <path d="M -200 750 Q 500 600 1000 800 T 1800 750" />
        </g>

        {/* Sweeping diagonals */}
        <g stroke="#f43f5e" strokeWidth="1" fill="none" opacity="0.04">
          <path d="M 0 0 Q 720 550 1440 0" />
          <path d="M 0 900 Q 720 350 1440 900" />
        </g>
      </svg>
    </div>
  );
}
