"use client";

import { useEffect, useState } from "react";

type NavLink = {
  label: string;
  href: string;
};

const NAV_LINKS: NavLink[] = [
  { label: "Book a slot", href: "#book" },
  { label: "Tournaments", href: "#tournaments" },
  { label: "Academy", href: "#academy" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

function MandalaMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22" stroke="#E3A73A" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="15" stroke="#E3A73A" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="4.5" fill="#E3A73A" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        const x1 = 24 + Math.cos(angle) * 15;
        const y1 = 24 + Math.sin(angle) * 15;
        const x2 = 24 + Math.cos(angle) * 22;
        const y2 = 24 + Math.sin(angle) * 22;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#E3A73A"
            strokeWidth="1.4"
          />
        );
      })}
    </svg>
  );
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded font-semibold transition-transform duration-150 border";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-[100] border-b transition-colors duration-300 ${
        scrolled
          ? "bg-bg-darker/90 backdrop-blur-md border-panel-line"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="container-arena flex items-center h-[68px] sm:h-[76px] gap-3 sm:gap-7">
        <a
          href="#top"
          className="flex items-center gap-3 mr-auto"
          aria-label="Mandala Futshal Arena, home"
          onClick={() => setMenuOpen(false)}
        >
          <span className="shrink-0">
            <MandalaMark size={30} />
          </span>
          <span className="hidden sm:inline font-display font-semibold text-[17px] text-paper whitespace-nowrap">
            Mandala <span className="text-gold">Futshal Arena</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-6" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14.5px] font-medium text-paper-dim hover:text-paper transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#book"
          className={`${btnBase} hidden lg:inline-flex bg-gold text-[#1B1204] border-transparent hover:bg-[#EEB753] hover:-translate-y-px px-5 py-2.5 text-sm whitespace-nowrap`}
        >
          Reserve a slot
        </a>

        <button
          className="lg:hidden flex flex-col justify-center gap-1.5 w-11 h-11 shrink-0 border border-panel-line rounded"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span
            className={`block w-[18px] h-0.5 mx-auto bg-paper transition-transform duration-200 ${
              menuOpen ? "translate-y-[6px] rotate-45" : ""
            }`}
          />
          <span
            className={`block w-[18px] h-0.5 mx-auto bg-paper transition-transform duration-200 ${
              menuOpen ? "-translate-y-[6px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      <div
        className={`lg:hidden overflow-hidden bg-bg-darker border-b transition-[max-height] duration-300 ${
          menuOpen ? "max-h-[360px] border-panel-line" : "max-h-0 border-transparent"
        }`}
      >
        <nav
          className="flex flex-col px-6 pt-2 pb-6 gap-1"
          aria-label="Mobile"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-3 px-1 text-[15px] text-paper-dim border-b border-panel-line"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#book"
            className={`${btnBase} bg-gold text-[#1B1204] border-transparent hover:bg-[#EEB753] mt-3.5 w-full px-5 py-3`}
            onClick={() => setMenuOpen(false)}
          >
            Reserve a slot
          </a>
        </nav>
      </div>
    </header>
  );
}