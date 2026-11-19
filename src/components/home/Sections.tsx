import { Media, Pitch, tones } from "./Art";
import { Arrow, Ball, Calendar, Search, Shield, Users } from "./Icons";
import type { ReactNode } from "react";

const i = (n: number) => ({ "--i": n }) as React.CSSProperties;

function Head({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-5 sm:mb-14 md:flex-row md:items-end" data-reveal>
      <div className="max-w-xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="h2 mt-4">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* Informational content only — no venue, tournament, or usage claims until real data exists. */
const PLATFORM = [
  {
    icon: Search,
    title: "Discover places to play",
    text: "Explore futsal venues when they join BookIN. Compare the details that matter and find a playing space that suits your squad.",
  },
  {
    icon: Calendar,
    title: "Choose a time that works",
    text: "Check available time slots and make a booking through one clear flow, without having to coordinate everything by phone.",
  },
  {
    icon: Shield,
    title: "Clear, reliable information",
    text: "Venue details, booking status, and account information are designed to stay together so players know what to expect.",
  },
];

export function PlatformInfo() {
  return (
    <section id="players" className="section">
      <div className="ambient -left-40 top-20 h-96 w-96 opacity-40" aria-hidden />
      <div className="wrap relative">
        <Head eyebrow="The BookIN platform" title={<>Everything around<br className="hidden sm:block" /> your next game.</>}>
          <p className="max-w-sm text-muted">
            BookIN is being built to make finding a place to play, organizing a squad, and managing bookings simpler.
          </p>
        </Head>
        <ul className="grid gap-5 md:grid-cols-3 md:gap-6">
          {PLATFORM.map(({ icon: Icon, title, text }, n) => (
            <li key={title} data-reveal style={i(n)}>
              <article className="glass lift relative h-full overflow-hidden rounded-3xl p-6 sm:p-8">
                <span className="absolute -right-5 -top-7 text-8xl font-bold tracking-tighter opacity-[0.045]">0{n + 1}</span>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-[#0b0d0c] shadow-[0_10px_30px_-8px_var(--glow)]">
                  <Icon width={26} height={26} />
                </span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{text}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
const STEPS = [
  { icon: Search, title: "Discover", text: "Explore participating futsal venues and review their facilities, location, and available information." },
  { icon: Calendar, title: "Book", text: "Choose a suitable time slot and keep your booking details together in your account." },
  { icon: Ball, title: "Play", text: "Bring your squad, enjoy the game, and keep track of your activity through BookIN." },
];

export function HowItWorks() {
  return (
    <section id="how" className="section bg-bg2/60">
      <div className="wrap">
        <Head eyebrow="A simpler match day" title={<>From planning to kickoff<br className="hidden sm:block" /> in three moves.</>} />
        <ol className="relative grid gap-5 md:grid-cols-3 md:gap-6">
          <div className="absolute left-[16.6%] right-[16.6%] top-[3.6rem] hidden h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50 md:block" aria-hidden />
          {STEPS.map(({ icon: Icon, title, text }, n) => (
            <li key={title} data-reveal style={i(n)}>
              <div className="glass lift relative h-full rounded-3xl p-6 sm:p-8">
                <span className="absolute right-6 top-5 text-6xl font-bold tracking-tighter opacity-[0.06]">0{n + 1}</span>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-[#0b0d0c] shadow-[0_10px_30px_-8px_var(--glow)]">
                  <Icon width={26} height={26} />
                </span>
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

/* ---------- CTA ---------- */
export function CTA() {
  return (
    <section className="section pt-4">
      <div className="wrap">
        <div className="on-dark relative isolate overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white sm:px-12 sm:py-24" data-reveal style={{ background: "linear-gradient(135deg,#0c1a10,#0b0d0c 55%,#16260a)" }}>
          <div className="ambient left-1/2 top-0 h-80 w-80 -translate-x-1/2 -translate-y-1/2 opacity-70" style={{ background: "rgba(184,255,44,.35)" }} aria-hidden />
          <div className="absolute inset-0 -z-10 opacity-30"><Pitch tone={["#1f7a3a", "#0b0d0c"]} /></div>
          <h2 className="mx-auto max-w-3xl text-[clamp(2.1rem,6vw,4.2rem)] font-bold leading-[1.02] tracking-[-0.04em]">Your Next Match <span className="text-accent">Starts Here.</span></h2>
          <p className="mx-auto mt-5 max-w-md text-white/70">Create your account and get ready to manage your game day in one place.</p>
          <a href="/auth/register" className="btn btn-primary mt-9 !px-9 !py-4 text-base">Get Started <Arrow width={18} height={18} /></a>
        </div>
      </div>
    </section>
  );
}
