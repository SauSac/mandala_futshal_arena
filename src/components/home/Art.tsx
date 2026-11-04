import Image from "next/image";
import type { ReactNode } from "react";

/** Cinematic indoor futsal stadium (always dark). Swap for a photo by adding <Image> in Hero. */
export function HeroScene() {
  const lights = [180, 400, 620, 800, 980, 1200, 1420];
  return (
    <svg aria-hidden viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="hw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#040605" /><stop offset=".55" stopColor="#0c1411" /><stop offset="1" stopColor="#0a1a0e" /></linearGradient>
        <linearGradient id="hf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#14381c" /><stop offset="1" stopColor="#071509" /></linearGradient>
        <radialGradient id="hg"><stop offset="0" stopColor="#d4ff63" stopOpacity=".6" /><stop offset="1" stopColor="#d4ff63" stopOpacity="0" /></radialGradient>
        <radialGradient id="hv" cx=".5" cy=".62" r=".7"><stop offset=".3" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".7" /></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#hw)" />
      {/* back wall panels */}
      {Array.from({ length: 9 }).map((_, i) => (<rect key={i} x={i * 180 - 10} y="250" width="170" height="220" fill="#ffffff" opacity=".018" />))}
      {/* ceiling lights */}
      {lights.map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy={90 + (i % 2) * 14} rx="150" ry="120" fill="url(#hg)" opacity=".5" />
          <rect x={x - 46} y={70 + (i % 2) * 14} width="92" height="8" rx="4" fill="#f1ffc4" />
        </g>
      ))}
      {/* floor */}
      <polygon points="470,470 1130,470 1900,900 -300,900" fill="url(#hf)" />
      <ellipse cx="800" cy="640" rx="620" ry="150" fill="url(#hg)" opacity=".16" />
      <g fill="none" stroke="#e9ffb5" strokeOpacity=".5" strokeWidth="3">
        <polygon points="560,480 1040,480 1540,880 60,880" />
        <line x1="800" y1="480" x2="800" y2="880" />
        <ellipse cx="800" cy="680" rx="190" ry="48" />
        <polygon points="700,480 900,480 960,540 640,540" />
        <polygon points="620,880 980,880 1080,780 520,780" />
      </g>
      {/* goal */}
      <g fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="4"><path d="M730 480v-62h140v62" /><path d="M740 430h120M740 445h120M740 460h120" strokeOpacity=".25" strokeWidth="2" /></g>
      {/* stands silhouette */}
      <path d="M0 470 L470 470 L380 400 L0 330Z M1600 470 L1130 470 L1220 400 L1600 330Z" fill="#020403" opacity=".85" />
      <rect width="1600" height="900" fill="url(#hv)" />
    </svg>
  );
}

type Tone = [string, string];
export const tones: Tone[] = [["#1f7a3a", "#0b2a16"], ["#2563eb", "#0a1a3d"], ["#7c3aed", "#1d0f40"], ["#0d9488", "#062a27"], ["#ea580c", "#331205"], ["#c026d3", "#2d0834"]];

/** Top-down futsal court illustration used as a placeholder for arena photography. */
export function Pitch({ tone = tones[0] }: { tone?: Tone }) {
  return (
    <svg aria-hidden viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <defs>
        <linearGradient id={`p${tone[0]}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={tone[0]} /><stop offset="1" stopColor={tone[1]} /></linearGradient>
        <radialGradient id={`g${tone[0]}`} cx=".3" cy=".1" r=".9"><stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#p${tone[0]})`} />
      {Array.from({ length: 8 }).map((_, i) => (<rect key={i} x={i * 50} width="25" height="260" fill="#fff" opacity=".04" />))}
      <g fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2">
        <rect x="26" y="26" width="348" height="208" rx="6" /><line x1="200" y1="26" x2="200" y2="234" />
        <circle cx="200" cy="130" r="36" /><path d="M26 82h42v96H26M374 82h-42v96h42" />
      </g>
      <circle cx="200" cy="130" r="4" fill="#fff" opacity=".8" />
      <rect width="400" height="260" fill={`url(#g${tone[0]})`} />
    </svg>
  );
}

/** Media slot: pass a local `photo` (e.g. "/images/arena-1.jpg" in /public) to use real photography. */
export function Media({ photo, alt, children, className = "" }: { photo?: string; alt: string; children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="zoom absolute inset-0">
        {photo ? <Image src={photo} alt={alt} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover" /> : children}
      </div>
    </div>
  );
}