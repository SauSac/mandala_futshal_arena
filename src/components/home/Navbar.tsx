"use client";
import { useEffect, useState } from "react";
import { Logo, Sun, Moon, Menu, Close } from "./Icons";
import { NAV } from "./Nav";


export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let previousScrolled = false;

    const onScroll = () => {
      // Avoid doing layout/state work for every raw scroll event.
      if (!document.body.classList.contains("is-scrolling")) {
        document.body.classList.add("is-scrolling");
      }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        document.body.classList.remove("is-scrolling");
      }, 140);

      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const nextScrolled = window.scrollY > 24;
        if (nextScrolled !== previousScrolled) {
          previousScrolled = nextScrolled;
          setScrolled(nextScrolled);
        }
      });
    };

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    previousScrolled = window.scrollY > 24;
    setScrolled(previousScrolled);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      if (frame) window.cancelAnimationFrame(frame);
      if (idleTimer) clearTimeout(idleTimer);
      document.body.classList.remove("is-scrolling");
    };
  }, []);

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("bookin-theme", next); } catch {}
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className={`nav-shell glass mx-auto max-w-5xl rounded-[1.6rem] px-3 py-2.5 sm:px-4 lg:rounded-full ${scrolled ? "shadow-2xl" : ""}`} style={{ transform: scrolled ? "scale(.985)" : undefined }}>
        <nav aria-label="Main" className="flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2.5 rounded-full pr-2" aria-label="BookIN home">
            <Logo />
            <span className="text-lg font-bold tracking-tight">Book<span className="text-accent-text">IN</span></span>
          </a>

          <ul className="hidden items-center gap-6 lg:flex xl:gap-7">
            {NAV.map((l) => (<li key={l.href}><a href={l.href} className="navlink">{l.label}</a></li>))}
          </ul>

          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} aria-label="Toggle light and dark theme" className="btn btn-ghost !p-0 h-10 w-10">
              <Sun className="i-sun" /><Moon className="i-moon" />
            </button>
            <a href="#" className="navlink hidden px-3 sm:inline lg:px-2">Login</a>
            <a href="#" className="btn btn-primary hidden !py-2.5 sm:inline-flex">Get Started</a>
            <button type="button" className="btn btn-ghost !p-0 h-10 w-10 lg:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </nav>

        <div id="mobile-menu" className="nav-panel lg:hidden" data-open={open} inert={!open}>
          <div>
            <ul className="flex flex-col gap-1 pb-2 pt-4">
              {NAV.map((l, i) => (
                <li key={l.href}>
                  <a href={l.href} style={{ "--i": i } as React.CSSProperties} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-white/10">{l.label}</a>
                </li>
              ))}
              <li className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
                <a href="#" className="btn btn-ghost">Login</a>
                <a href="#" className="btn btn-primary">Get Started</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}