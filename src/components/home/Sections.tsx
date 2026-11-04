import { Counter } from "./Client";
import { Media, Pitch, tones } from "./Art";
import { Arrow, Ball, Calendar, Clock, Pin, Search, Star, Trophy, Users } from "./Icons";
import type { ReactNode } from "react";

const i = (n: number) => ({ "--i": n }) as React.CSSProperties;

function Head({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-5 sm:mb-14 md:flex-row md:items-end" data-reveal>
      <div className="max-w-xl"><p className="eyebrow">{eyebrow}</p><h2 className="h2 mt-4">{title}</h2></div>
      {children}
    </div>
  );
}

/* ---------- Statistics (placeholder values — edit freely) ---------- */
const STATS = [
  { icon: Pin, label: "Arenas", value: 120, suffix: "+" },
  { icon: Users, label: "Players", value: 18500, suffix: "+" },
  { icon: Trophy, label: "Tournaments", value: 340, suffix: "" },
  { icon: Calendar, label: "Bookings", value: 64000, suffix: "+" },
];

export function Stats() {
  return (
    <section aria-label="BookIN in numbers" className="relative -mt-16 z-10 pb-4">
      <div className="wrap">
        <ul className="glass grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] p-2 sm:p-3 lg:grid-cols-4" data-reveal>
          {STATS.map(({ icon: Icon, label, value, suffix }) => (
            <li key={label} className="flex flex-col gap-1 rounded-2xl px-4 py-5 sm:px-6 sm:py-6">
              <Icon className="text-accent-text" />
              <p className="mt-2 text-[clamp(1.75rem,4.5vw,2.75rem)] font-bold leading-none tracking-tight tabular-nums"><Counter to={value} suffix={suffix} /></p>
              <p className="text-sm text-muted">{label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Arenas ---------- */
type Arena = { name: string; location: string; price: number; rating: number; reviews: number; status: "open" | "fast" | "few"; photo?: string };
const ARENAS: Arena[] = [
  { name: "Lakeside Futsal Arena", location: "Pokhara, Gandaki", price: 2200, rating: 4.9, reviews: 212, status: "open" },
  { name: "Urban Kick Centre", location: "Kathmandu, Bagmati", price: 2800, rating: 4.8, reviews: 341, status: "fast" },
  { name: "Southgate Indoor Pitch", location: "Butwal, Lumbini", price: 1800, rating: 4.7, reviews: 156, status: "open" },
  { name: "Halftime Sports Hub", location: "Lalitpur, Bagmati", price: 2500, rating: 4.8, reviews: 189, status: "few" },
  { name: "Riverside Arena", location: "Bharatpur, Chitwan", price: 1900, rating: 4.6, reviews: 98, status: "open" },
  { name: "Apex Futsal Dome", location: "Bhairahawa, Lumbini", price: 2100, rating: 4.7, reviews: 127, status: "fast" },
];
const STATUS = {
  open: { t: "Available now", c: "bg-accent text-[#0b0d0c]" },
  fast: { t: "Filling fast", c: "bg-amber-400 text-[#1d1300]" },
  few: { t: "2 slots left", c: "bg-rose-400 text-[#2a0509]" },
} as const;

export function Arenas() {
  return (
    <section id="arenas" className="section">
      <div className="ambient -left-40 top-20 h-96 w-96 opacity-40" aria-hidden />
      <div className="wrap relative">
        <Head eyebrow="Explore Arenas" title={<>Find the pitch that<br className="hidden sm:block" /> fits your game.</>}>
          <a href="#" className="btn btn-ghost self-start md:self-auto">View all arenas <Arrow width={18} height={18} /></a>
        </Head>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {ARENAS.map((a, n) => {
            const s = STATUS[a.status];
            return (
              <li key={a.name} data-reveal style={i(n % 3)}>
                <article className="glass lift group h-full overflow-hidden rounded-3xl">
                  <Media photo={a.photo} alt={a.name} className="aspect-[16/10]"><Pitch tone={tones[n % tones.length]} /></Media>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold leading-snug tracking-tight">{a.name}</h3>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-sm font-semibold"><Star width={14} height={14} className="text-accent-text" />{a.rating}</span>
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted"><Pin width={15} height={15} />{a.location}<span className="opacity-60">· {a.reviews} reviews</span></p>
                    <div className="mt-5 flex items-center justify-between border-t border-[var(--glass-b)] pt-4">
                      <p><span className="text-xl font-bold">Rs {a.price.toLocaleString("en-US")}</span><span className="text-sm text-muted"> / hour</span></p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.c}`}>{s.t}</span>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
const STEPS = [
  { icon: Search, title: "Discover", text: "Browse verified futsal arenas by location, price and rating. Compare facilities in seconds." },
  { icon: Calendar, title: "Book", text: "Pick a time slot that suits your squad and lock in your pitch. No calls, no back-and-forth." },
  { icon: Ball, title: "Play", text: "Show up, kick off and enjoy. Build your team, climb tournaments and keep the streak alive." },
];

export function HowItWorks() {
  return (
    <section id="how" className="section bg-bg2/60">
      <div className="wrap">
        <Head eyebrow="How it works" title={<>From search to kickoff<br className="hidden sm:block" /> in three moves.</>} />
        <ol className="relative grid gap-5 md:grid-cols-3 md:gap-6">
          <div className="absolute left-[16.6%] right-[16.6%] top-[3.6rem] hidden h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50 md:block" aria-hidden />
          {STEPS.map(({ icon: Icon, title, text }, n) => (
            <li key={title} data-reveal style={i(n)}>
              <div className="glass lift relative h-full rounded-3xl p-6 sm:p-8">
                <span className="absolute right-6 top-5 text-6xl font-bold tracking-tighter opacity-[0.06]">0{n + 1}</span>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-[#0b0d0c] shadow-[0_10px_30px_-8px_var(--glow)]"><Icon width={26} height={26} /></span>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-2.5 leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Tournaments ---------- */
const TOURNAMENTS = [
  { name: "Himalayan Futsal Cup", date: "Nov 22", teams: 32, prize: "Rs 250,000", label: "Registration open" },
  { name: "City League Season 4", date: "Dec 06", teams: 16, prize: "Rs 120,000", label: "Starting soon" },
  { name: "Night Owl 5v5 Series", date: "Dec 19", teams: 24, prize: "Rs 80,000", label: "Upcoming" },
];

export function Tournaments() {
  return (
    <section id="tournaments" className="section relative overflow-hidden">
      <div className="ambient -right-40 top-10 h-[28rem] w-[28rem] opacity-40" aria-hidden />
      <div className="wrap relative">
        <Head eyebrow="Tournaments" title={<>Compete. Climb.<br className="hidden sm:block" /> Lift the trophy.</>}>
          <p className="max-w-sm text-muted">Join community cups and city leagues hosted at the best arenas. Gather your squad and make your mark.</p>
        </Head>
        <ul className="grid gap-5 md:grid-cols-3 md:gap-6">
          {TOURNAMENTS.map((t, n) => (
            <li key={t.name} data-reveal style={i(n)}>
              <article className="glass lift group h-full overflow-hidden rounded-3xl">
                <Media alt={t.name} className="aspect-[16/11]">
                  <div className="relative h-full w-full">
                    <Pitch tone={tones[(n + 3) % tones.length]} />
                    <Trophy width={110} height={110} strokeWidth={1.1} className="absolute inset-0 m-auto text-white/85 drop-shadow-[0_0_30px_rgba(184,255,44,.5)]" />
                  </div>
                </Media>
                <div className="p-5 sm:p-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-[#0b0d0c]"><span className="h-1.5 w-1.5 rounded-full bg-[#0b0d0c]" />{t.label}</span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">{t.name}</h3>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    {[["Starts", t.date, Clock], ["Teams", String(t.teams), Users], ["Prize", t.prize, Trophy]].map(([k, v, Ic]) => {
                      const Icon = Ic as typeof Clock;
                      return (<div key={k as string}><dt className="flex items-center gap-1 text-xs text-muted"><Icon width={13} height={13} />{k as string}</dt><dd className="mt-1 font-semibold">{v as string}</dd></div>);
                    })}
                  </dl>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
export function CTA() {
  return (
    <section className="section pt-4">
      <div className="wrap">
        <div className="on-dark relative isolate overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white sm:px-12 sm:py-24" data-reveal style={{ background: "linear-gradient(135deg,#0c1a10,#0b0d0c 55%,#16260a)" }}>
          <div className="ambient left-1/2 top-0 h-80 w-80 -translate-x-1/2 -translate-y-1/2 opacity-70" style={{ background: "rgba(184,255,44,.35)" }} aria-hidden />
          <div className="absolute inset-0 -z-10 opacity-30"><Pitch tone={["#1f7a3a", "#0b0d0c"]} /></div>
          <h2 className="mx-auto max-w-3xl text-[clamp(2.1rem,6vw,4.2rem)] font-bold leading-[1.02] tracking-[-0.04em]">Your Next Match <span className="text-accent">Starts Here.</span></h2>
          <p className="mx-auto mt-5 max-w-md text-white/70">Join thousands of players already booking smarter.</p>
          <a href="#" className="btn btn-primary mt-9 !px-9 !py-4 text-base">Get Started <Arrow width={18} height={18} /></a>
        </div>
      </div>
    </section>
  );
}