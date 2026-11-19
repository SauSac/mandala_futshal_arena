import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import AuthVisual from "./AuthVisual";

type AuthShellProps = {
  mode: "login" | "register";
  children: ReactNode;
};

export default function AuthShell({ mode, children }: AuthShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-visual-panel" aria-label="BookIN sports experience">
        <Link href="/" className="auth-brand" aria-label="BookIN home">
          <Image src="/brand/bookin-logo.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl object-contain" />
          <span>Book<span>IN</span></span>
        </Link>

        <AuthVisual />

        <div className="auth-visual-copy">
          <p className="auth-kicker"><span className="auth-live-dot" /> YOUR GAME. YOUR TIME.</p>
          <h1>Find your pitch.<br /><em>Own the moment.</em></h1>
          <p className="auth-visual-description">
            Discover arenas, bring your team together, and get in the game.
            Your next match starts here.
          </p>
          <div className="auth-visual-footer">
            <span>PLAY MORE. PLAN LESS.</span>
            <span>BOOKIN SPORTS NETWORK</span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-topbar">
          <Link href="/" className="auth-mobile-brand" aria-label="BookIN home">
            <Image src="/brand/bookin-logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-contain" />
            <span>Book<span>IN</span></span>
          </Link>
          <div className="auth-topbar-right">
            <span className="auth-topbar-caption"> {mode === "login" ? "NEW TO BOOKIN?" : "ALREADY A MEMBER?"}</span>
            <Link className="auth-topbar-link" href={mode === "login" ? "/auth/register" : "/auth/login"}>
              {mode === "login" ? "Create account" : "Sign in"}
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <div className="auth-form-wrap">
          {children}
        </div>

        <footer className="auth-legal">
          <span>© {new Date().getFullYear()} BookIN</span>
          <span>BUILT FOR THE LOVE OF THE GAME</span>
        </footer>
      </section>
    </main>
  );
}
