import Image from "next/image";
import { Facebook, Instagram, Pin, XIcon, Youtube } from "./Icons";
import { NAV } from "./Nav";

const SOCIAL = [
  { label: "Instagram", Icon: Instagram }, { label: "Facebook", Icon: Facebook },
  { label: "X", Icon: XIcon }, { label: "YouTube", Icon: Youtube },
];

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-[var(--glass-b)] bg-bg2/60">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr] lg:gap-16">
        <div>
          <a href="/" className="inline-flex items-center gap-2.5" aria-label="BookIN home"><Image src="/brand/bookin-logo.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl object-contain" /><span className="text-lg font-bold tracking-tight">Book<span className="text-accent-text">IN</span></span></a>
          <p className="mt-4 max-w-sm leading-relaxed text-muted">Futsal arena discovery and booking, built for players, teams and the venues that host them.</p>
          <ul className="mt-6 flex gap-2">
            {SOCIAL.map(({ label, Icon }) => (
              <li key={label}><a href="#" aria-label={label} className="btn btn-ghost !p-0 h-10 w-10"><Icon /></a></li>
            ))}
          </ul>
        </div>
        <nav aria-label="Footer">
          <h3 className="text-sm font-semibold">Navigate</h3>
          <ul className="mt-4 space-y-2.5">{NAV.map((l) => (<li key={l.href}><a href={l.href} className="navlink">{l.label}</a></li>))}</ul>
        </nav>
        <div>
          <h3 className="text-sm font-semibold">Contact</h3>
          <address className="mt-4 space-y-2.5 text-sm not-italic text-muted">
            <p><a href="mailto:bookin@gmail.com" className="navlink">bookin@gmail.com</a></p>
            <p><a href="tel:+9779717455423" className="navlink">+977 971 745 5423</a></p>
            <p className="flex items-center gap-1.5"><Pin width={15} height={15} />Kathmandu, Nepal</p>
          </address>
        </div>
      </div>
      <div className="border-t border-[var(--glass-b)] py-5 text-center text-xs text-muted">© 2026 BookIN. All rights reserved.</div>
    </footer>
  );
}