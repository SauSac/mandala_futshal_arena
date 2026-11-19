import { HeroScene } from "./Art";
import Football from "./Football";
import { Arrow, Calendar, Users } from "./Icons";

const d = (ms: number) => ({ "--d": ms }) as React.CSSProperties;

export default function Hero() {
  return (
    <section id="top" className="on-dark relative isolate min-h-[100svh] overflow-hidden text-white">
      <HeroScene />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/25 lg:bg-gradient-to-r lg:from-black/70 lg:via-black/25 lg:to-transparent" aria-hidden />
      <div className="beam" style={{ left: "6%" }} aria-hidden />
      <div className="beam" style={{ right: "4%", animationDelay: "-4s" }} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-0 h-48 bg-gradient-to-t from-bg to-transparent" aria-hidden />

      <div className="wrap relative z-10 grid min-h-[100svh] items-center gap-6 pb-20 pt-32 lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:pt-28">
        <div className="max-w-xl md:max-w-2xl">
          <p className="rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md" style={d(100)}>
            <span className="pulse-dot h-2 w-2 rounded-full bg-accent" /> Futsal booking, teams &amp; community
          </p>
          <h1 className="mt-5 text-[clamp(2.6rem,7.4vw,5.4rem)] font-bold leading-[0.98] tracking-[-0.045em]">
            <span className="rise block" style={d(200)}>Your Game.</span>
            <span className="rise block" style={d(320)}>Your <span className="text-accent">Arena.</span></span>
            <span className="rise block" style={d(440)}>Your Time.</span>
          </h1>
          <p className="rise mt-6 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg" style={d(600)}>
            Find places to play, organize your team, and manage your futsal bookings — all through one simple platform.
          </p>
          <div className="rise mt-8 flex flex-col gap-3 sm:flex-row" style={d(760)}>
            <a href="#players" className="btn btn-primary !px-7 !py-3.5">Explore BookIN <Arrow width={18} height={18} /></a>
            <a href="/auth/register" className="btn btn-ghost !px-7 !py-3.5">Join BookIN</a>
          </div>
        </div>

        <div className="rise relative mx-auto h-[21rem] w-full max-w-md sm:h-[27rem] sm:max-w-xl lg:h-[34rem] lg:max-w-none" style={d(500)}>
          <div className="absolute inset-0 grid place-items-center"><Football /></div>
          <div className="float glass absolute left-0 top-2 w-44 rounded-2xl p-3.5 text-white sm:left-4 sm:top-6 sm:w-52 sm:p-4" style={{ ...d(0), "--glass": "rgba(20,26,22,.5)" } as React.CSSProperties}>
            <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-white/60"><span className="pulse-dot h-2 w-2 rounded-full bg-accent" />Your game, organized</p>
            <p className="mt-1.5 text-lg font-semibold leading-tight sm:text-xl">Plan your next match</p>
          </div>
          <div className="float glass absolute right-0 top-[38%] w-40 rounded-2xl p-3.5 text-white sm:w-48 sm:p-4" style={{ ...d(1200), "--glass": "rgba(20,26,22,.5)" } as React.CSSProperties}>
            <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-white/60"><Calendar width={14} height={14} />Simple booking</p>
            <p className="mt-1.5 text-lg font-semibold sm:text-xl">Choose your time</p>
          </div>
          <div className="float glass absolute bottom-2 left-2 w-48 rounded-2xl p-3.5 text-white sm:left-10 sm:w-56 sm:p-4" style={{ ...d(2400), "--glass": "rgba(20,26,22,.5)" } as React.CSSProperties}>
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-white/60"><Users width={13} height={13} />Built for squads</p>
            <p className="mt-1.5 text-base font-semibold sm:text-lg">Bring your team together</p>
          </div>
        </div>
      </div>
    </section>
  );
}
