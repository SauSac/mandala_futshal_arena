import Link from "next/link";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import ContactForm from "./ContactForm";
import { Pin } from "@/components/home/Icons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact BookIN | We're here to help",
  description: "Get in touch with the BookIN team about arenas, bookings, partnerships or support.",
};

export default function ContactPage() {
  return <><Navbar /><main className="page marketing-page">
    <section className="marketing-hero wrap"><p className="eyebrow">CONTACT</p><h1 className="marketing-title mt-6">Let's talk about<br /><span>the beautiful game.</span></h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">Questions about BookIN, your arena, or how to get involved? Send us a message and we'll be glad to hear from you.</p></section>
    <section className="wrap grid gap-8 pb-24 lg:grid-cols-[.75fr_1.25fr] lg:gap-12">
      <aside className="space-y-4">
        <div className="glass rounded-3xl p-6"><p className="text-xs font-semibold tracking-[.18em] text-accent-text">EMAIL</p><Link href="mailto:bookin@gmail.com" className="mt-3 block text-lg font-semibold hover:text-accent-text">bookin@gmail.com</Link><p className="mt-2 text-sm text-muted">For general questions and support.</p></div>
        <div className="glass rounded-3xl p-6"><p className="text-xs font-semibold tracking-[.18em] text-accent-text">PHONE</p><Link href="tel:+9779717455423" className="mt-3 block text-lg font-semibold hover:text-accent-text">+977 971 745 5423</Link><p className="mt-2 text-sm text-muted">Call us for enquiries.</p></div>
        <div className="glass rounded-3xl p-6"><p className="text-xs font-semibold tracking-[.18em] text-accent-text">LOCATION</p><p className="mt-3 flex items-center gap-2 font-semibold"><Pin width={18} height={18}/> Nepal</p><p className="mt-2 text-sm text-muted">Connecting players and futsal communities.</p></div>
        <p className="px-2 text-sm leading-relaxed text-muted">Looking to join BookIN? <Link href="/auth/register" className="font-semibold text-accent-text">Create a player account</Link>.</p>
      </aside>
      <ContactForm />
    </section>
  </main><Footer /></>;
}
