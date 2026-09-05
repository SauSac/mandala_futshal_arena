import Navbar from "@/components/Navbar";

type Stat = { value: string; label: string };

const STATS: Stat[] = [
  { value: "2", label: "Indoor futsal courts" },
  { value: "3", label: "Floodlit turf pitches" },
  { value: "5,200+", label: "Matches hosted" },
  { value: "6am–11pm", label: "Open daily" },
];

type Feature = {
  title: string;
  body: string;
  accent: "gold" | "crimson";
  size: "large" | "small";
};

const FEATURES: Feature[] = [
  {
    title: "Book any court in under a minute",
    body: "Indoor or outdoor, five-a-side or full-size. Confirmation lands instantly, no calls back and forth.",
    accent: "gold",
    size: "large",
  },
  {
    title: "Indoor futsal, rain or shine",
    body: "Two covered hardcourts mean your slot never gets rained out.",
    accent: "crimson",
    size: "small",
  },
  {
    title: "Outdoor turf, fully floodlit",
    body: "Three grass turfs under full floodlighting, so a 9pm kickoff plays like a 4pm one.",
    accent: "gold",
    size: "small",
  },
  {
    title: "Tournaments, run properly",
    body: "Fixtures, brackets and referees sorted for you, across both indoor and outdoor formats. We've run weekend leagues since 2019.",
    accent: "crimson",
    size: "large",
  },
];

type Step = { n: string; title: string; body: string };

const STEPS: Step[] = [
  {
    n: "01",
    title: "Choose indoor or outdoor",
    body: "Covered futsal hardcourt or full-size grass turf — see what's open in real time.",
  },
  {
    n: "02",
    title: "Pick your hour",
    body: "Morning training slot or a floodlit 9pm kickoff, the calendar shows exact availability.",
  },
  {
    n: "03",
    title: "Confirm and play",
    body: "Pay online or at the gate. Bibs, balls and a referee are ready when you arrive.",
  },
];

function MandalaGlyph() {
  return (
    <svg
      viewBox="0 0 520 520"
      className="w-[260px] mx-auto lg:w-[min(420px,100%)] lg:mx-0"
      aria-hidden="true"
    >
      <circle cx="260" cy="260" r="240" stroke="#E3A73A" strokeOpacity="0.35" strokeWidth="1" />
      <circle cx="260" cy="260" r="190" stroke="#E3A73A" strokeOpacity="0.5" strokeWidth="1" />
      <circle cx="260" cy="260" r="140" stroke="#9C3B3B" strokeOpacity="0.6" strokeWidth="1" />
      <circle cx="260" cy="260" r="92" stroke="#E3A73A" strokeWidth="1.2" />
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * Math.PI) / 8;
        const x1 = 260 + Math.cos(angle) * 92;
        const y1 = 260 + Math.sin(angle) * 92;
        const x2 = 260 + Math.cos(angle) * 240;
        const y2 = 260 + Math.sin(angle) * 240;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#E3A73A"
            strokeOpacity={i % 2 === 0 ? 0.28 : 0.14}
            strokeWidth="1"
          />
        );
      })}
      <circle cx="260" cy="260" r="46" fill="#0D1F16" stroke="#E3A73A" strokeWidth="1.4" />
      <circle cx="260" cy="260" r="6" fill="#E3A73A" />
    </svg>
  );
}

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded font-semibold border border-transparent bg-gold text-[#1B1204] px-6 py-3.5 text-[15px] transition-transform duration-150 hover:bg-[#EEB753] hover:-translate-y-px";

const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded font-semibold border border-panel-line text-paper px-6 py-3.5 text-[15px] transition-colors duration-150 hover:border-gold-dim hover:bg-gold/[0.06]";

export default function HomePage() {
  return (
    <>
      <a
        href="#main"
        className="absolute -left-[9999px] top-0 z-[200] rounded-br-md bg-gold px-4 py-2.5 text-[#1B1204] focus:left-0"
      >
        Skip to content
      </a>
      <div id="top">
        <Navbar />

        <main id="main">
          {/* Hero */}
          <section
            className="relative overflow-hidden bg-bg-dark pt-12 pb-10 sm:pt-16 sm:pb-12 md:pt-[88px] md:pb-[60px]"
            style={{
              backgroundImage:
                "radial-gradient(120% 90% at 78% 20%, rgba(156,59,59,0.16), transparent 60%)",
            }}
          >
            <div className="container-arena flex flex-col-reverse gap-10 items-center lg:grid lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <span className="inline-flex items-center gap-2.5 text-gold text-sm font-semibold">
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                    <circle cx="8" cy="8" r="7" stroke="#E3A73A" />
                    <circle cx="8" cy="8" r="2" fill="#E3A73A" />
                  </svg>
                  Two indoor courts, three floodlit turfs
                </span>
                <h1 className="text-[clamp(32px,8vw,62px)] leading-[1.08] tracking-[-0.01em] mt-[22px] mb-[22px]">
                  Where the city
                  <br />
                  plays, indoors and out.
                </h1>
                <p className="max-w-[46ch] text-paper-dim text-[17px]">
                  Mandala Futshal Arena pairs covered futsal hardcourts with
                  floodlit grass turf, so a booking that takes thirty seconds
                  gets you playing — rain, shine, or well after dark.
                </p>
                <div className="flex gap-3.5 mt-8 flex-wrap">
                  <a href="#book" className={btnPrimary}>Reserve a slot</a>
                  <a href="#tournaments" className={btnGhost}>See tournaments</a>
                </div>
              </div>
              <div className="flex justify-center">
                <MandalaGlyph />
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="bg-bg-darker border-y border-panel-line">
            <div className="container-arena grid grid-cols-2 sm:grid-cols-4 gap-y-7 py-10">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className={`text-center border-panel-line ${
                    i % 2 === 0 ? "border-l-0" : "border-l"
                  } ${i === 0 ? "sm:border-l-0" : "sm:border-l"}`}
                >
                  <div className="font-display text-[28px] font-semibold text-gold">
                    {s.value}
                  </div>
                  <div className="mt-1.5 text-[13.5px] text-paper-dim">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section className="py-14 md:py-24" id="tournaments">
            <div className="container-arena">
              <h2 className="text-[clamp(26px,3.4vw,36px)] max-w-[20ch] mb-10">
                Indoor courts, outdoor turf, one booking system
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className={`rounded-[10px] bg-panel border border-panel-line p-6 sm:p-[30px] flex flex-col justify-end min-h-[160px] border-t-[3px] ${
                      f.accent === "gold" ? "border-t-gold" : "border-t-crimson"
                    } ${f.size === "large" ? "md:col-span-2" : ""}`}
                  >
                    <h3 className="text-xl mb-2.5">{f.title}</h3>
                    <p className="text-paper-dim text-[15px] max-w-[42ch]">
                      {f.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="py-14 md:py-24 bg-bg-darker" id="book">
            <div className="container-arena">
              <h2 className="text-[clamp(26px,3.4vw,36px)] max-w-[20ch] mb-10">
                Booking takes three steps
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {STEPS.map((step) => (
                  <div key={step.n} className="border-t border-panel-line pt-5">
                    <span className="font-display text-gold-dim text-sm tracking-[0.06em]">
                      {step.n}
                    </span>
                    <h3 className="text-[19px] mt-3 mb-2.5">{step.title}</h3>
                    <p className="text-paper-dim text-[14.5px]">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Academy / CTA banner */}
          <section className="py-14 md:py-24" id="academy">
            <div className="container-arena">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-panel border border-panel-line rounded-[10px] p-6 sm:p-8 md:p-11">
                <div>
                  <h2 className="text-[clamp(26px,3.4vw,36px)] max-w-[20ch]">
                    Junior academy, three evenings a week
                  </h2>
                  <p className="text-paper-dim max-w-[52ch] mt-3">
                    Coaching groups run by age from 6 to 16, led by licensed
                    coaches, split across our indoor courts and outdoor turf.
                  </p>
                </div>
                <a href="#contact" className={btnPrimary}>Join the academy</a>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer
          className="bg-bg-darker border-t border-panel-line pt-14 pb-6"
          id="contact"
          aria-label="Site footer"
        >
          <div className="container-arena flex flex-wrap justify-between gap-8 pb-8 border-b border-panel-line">
            <div>
              <div className="font-display text-[19px] text-gold mb-2.5">
                Mandala Futshal Arena
              </div>
              <p className="text-paper-dimmer text-sm max-w-[40ch]">
                Open daily, 6am – 11pm · Indoor futsal courts &amp; floodlit
                turf pitches · Booking &amp; enquiries by phone or online
              </p>
            </div>
            <nav className="flex flex-wrap gap-5 self-start" aria-label="Footer">
              <a href="#book" className="text-paper-dim text-[14.5px] hover:text-gold">Book a slot</a>
              <a href="#tournaments" className="text-paper-dim text-[14.5px] hover:text-gold">Tournaments</a>
              <a href="#academy" className="text-paper-dim text-[14.5px] hover:text-gold">Academy</a>
              <a href="#gallery" className="text-paper-dim text-[14.5px] hover:text-gold">Gallery</a>
            </nav>
          </div>
          <div className="container-arena pt-5 text-paper-dimmer text-[13px]">
            © {new Date().getFullYear()} Mandala Futshal Arena. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}