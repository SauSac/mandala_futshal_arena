import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import { Ball, Calendar, Trophy, Users } from "@/components/home/Icons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About BookIN | Find your game",
  description: "Learn how BookIN makes discovering futsal arenas, booking a pitch and bringing teams together easier.",
};

const features = [
  { icon: Ball, title: "Discover arenas", text: "Find places to play and explore the facilities that fit your next match." },
  { icon: Calendar, title: "Book with clarity", text: "Make it easier to find a suitable playing time and keep your plans organised." },
  { icon: Users, title: "Bring your team", text: "Keep players connected and make getting everyone on the pitch simpler." },
  { icon: Trophy, title: "Play for more", text: "Discover tournaments and competitive opportunities in the futsal community." },
];

export default function AboutPage() {
  return <><Navbar /><main className="page marketing-page">
    <section className="marketing-hero wrap">
      <p className="eyebrow">ABOUT BOOKIN</p>
      <div className="mt-6 grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
        <div><h1 className="marketing-title">More time playing.<br /><span>Less time planning.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">BookIN is being built to make the futsal experience feel more connected — from finding a place to play, to organising a match, to joining the wider game.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/auth/register" className="btn btn-primary">Get started <span aria-hidden>↗</span></Link><Link href="/contact" className="btn btn-ghost">Talk to our team</Link></div>
        </div>
        <div className="about-logo-card glass"><div className="about-logo-halo" /><Image src="/brand/bookin-logo.png" alt="BookIN blue and white calendar-check logo" width={420} height={420} priority className="relative z-10 mx-auto w-full max-w-[17rem] rounded-[2rem]" /><p className="relative z-10 mt-5 text-center text-sm font-semibold tracking-[.2em] text-muted">FIND · BOOK · PLAY</p></div>
      </div>
    </section>
    <section className="section border-y border-[var(--glass-b)] bg-bg2/50"><div className="wrap grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
      <div><p className="eyebrow">OUR PURPOSE</p><h2 className="h2 mt-4">A better way to get <span className="text-accent-text">in the game.</span></h2></div>
      <div className="space-y-5 text-base leading-relaxed text-muted"><p>Finding a pitch, coordinating players and keeping track of match plans can take more effort than it should. BookIN brings those parts of the experience into one place.</p><p>Our vision is a practical platform for players, teams and futsal venues — designed around simple discovery, clearer bookings and a stronger local playing community.</p><p>We are building BookIN step by step. Features and venue availability will grow as the platform develops.</p></div>
    </div></section>
    <section className="section wrap"><div className="max-w-2xl"><p className="eyebrow">WHAT WE'RE BUILDING</p><h2 className="h2 mt-4">Everything around your next match.</h2></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(({icon: Icon,title,text},i)=><article key={title} className="glass lift rounded-3xl p-6" data-reveal style={{"--i":i} as React.CSSProperties}><span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent-text"><Icon width={24} height={24}/></span><h3 className="text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted">{text}</p></article>)}</div></section>
    <section className="wrap pb-24"><div className="glass relative overflow-hidden rounded-[2rem] p-8 sm:p-12"><div className="ambient -right-20 -top-24 h-64 w-64 opacity-30"/><p className="eyebrow">YOUR NEXT MATCH STARTS HERE</p><h2 className="h2 relative mt-4 max-w-2xl">Ready to make your next game happen?</h2><Link href="/auth/register" className="btn btn-primary relative mt-7">Create your account <span aria-hidden>↗</span></Link></div></section>
  </main><Footer /></>;
}
