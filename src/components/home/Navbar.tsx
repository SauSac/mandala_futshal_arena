"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sun, Moon, Menu, Close } from "./Icons";
import { NAV } from "./Nav";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("bookin-theme", next); } catch {}
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className={`nav-shell glass mx-auto max-w-6xl rounded-[1.6rem] px-3 py-2.5 sm:px-4 lg:rounded-full ${scrolled ? "shadow-2xl" : ""}`}>
        <nav aria-label="Main" className="flex items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="BookIN home">
            <Image src="/brand/bookin-logo.png" alt="BookIN logo" width={46} height={46} priority className="h-10 w-10 rounded-xl object-contain sm:h-11 sm:w-11" />
            <span className="text-lg font-bold tracking-tight">Book<span className="text-accent-text">IN</span></span>
          </Link>
          <ul className="hidden items-center gap-5 lg:flex xl:gap-7">
            {NAV.map((item) => <li key={item.href}><Link href={item.href} className="navlink">{item.label}</Link></li>)}
          </ul>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={toggleTheme} aria-label="Toggle light and dark theme" className="btn btn-ghost !p-0 h-10 w-10"><Sun className="i-sun" /><Moon className="i-moon" /></button>
            <Link href="/auth/login" className="navlink hidden px-2 sm:inline">Login</Link>
            <Link href="/auth/register" className="btn btn-primary hidden !py-2.5 sm:inline-flex">Get Started</Link>
            <button type="button" className="btn btn-ghost !p-0 h-10 w-10 lg:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <Close /> : <Menu />}</button>
          </div>
        </nav>
        <div id="mobile-menu" className="nav-panel lg:hidden" data-open={open} inert={!open}>
          <div><ul className="flex flex-col gap-1 pb-2 pt-4">
            {NAV.map((item, index) => <li key={item.href}><Link href={item.href} style={{ "--i": index } as React.CSSProperties} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-white/10">{item.label}</Link></li>)}
            <li className="mt-2 grid grid-cols-2 gap-2 sm:hidden"><Link href="/auth/login" onClick={() => setOpen(false)} className="btn btn-ghost">Login</Link><Link href="/auth/register" onClick={() => setOpen(false)} className="btn btn-primary">Get Started</Link></li>
          </ul></div>
        </div>
      </div>
    </header>
  );
}
