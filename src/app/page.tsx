import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  const btnPrimary =
    "inline-flex items-center justify-center rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:bg-yellow-400";

  const btnGhost =
    "inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10";

  return (
    <main className="min-h-screen bg-[#07111f] text-white">

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-3xl">

            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
              Multi-Arena Football Platform
            </p>

            <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Your football.
              <br />
              Your arena.
              <br />
              <span className="text-yellow-400">Your game.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
              Discover arenas, register as a player, build your team, book
              available slots, and compete in football tournaments.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">

              {/* Book a demo → Register */}
              <Link href="/auth/register" className={btnPrimary}>
                Book a demo
              </Link>

              <a href="#tournaments" className={btnGhost}>
                Explore tournaments
              </a>

            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              Everything in one place
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Built for players and arenas
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
              <h3 className="text-xl font-semibold">
                Find an Arena
              </h3>

              <p className="mt-3 text-white/60">
                Browse registered football and futsal arenas and check their
                availability.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
              <h3 className="text-xl font-semibold">
                Book a Slot
              </h3>

              <p className="mt-3 text-white/60">
                Check available time slots and book your preferred playing
                time.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
              <h3 className="text-xl font-semibold">
                Compete
              </h3>

              <p className="mt-3 text-white/60">
                Join individual competitions and compete against other
                registered players.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
                How it works
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Get on the pitch in three steps.
              </h2>

              <p className="mt-5 leading-7 text-white/60">
                Register once and use the platform to manage your football
                activities across participating arenas.
              </p>
            </div>

            <div className="space-y-5">

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <span className="text-sm font-bold text-yellow-400">
                  01
                </span>

                <h3 className="mt-2 text-lg font-semibold">
                  Register as a player
                </h3>

                <p className="mt-2 text-white/60">
                  Create your player account and complete your registration.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <span className="text-sm font-bold text-yellow-400">
                  02
                </span>

                <h3 className="mt-2 text-lg font-semibold">
                  Choose your arena
                </h3>

                <p className="mt-2 text-white/60">
                  Explore arenas and check available playing slots.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <span className="text-sm font-bold text-yellow-400">
                  03
                </span>

                <h3 className="mt-2 text-lg font-semibold">
                  Play and compete
                </h3>

                <p className="mt-2 text-white/60">
                  Book your slot, create your team, and participate in
                  competitions.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Tournaments */}
      <section
        id="tournaments"
        className="border-t border-white/10 py-24"
      >
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">

          <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Tournaments
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Compete against other players.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-white/60">
            Participate in individual 1v1 competitions and track your results
            through the platform.
          </p>

        </div>
      </section>

      {/* Registration CTA */}
      <section id="register" className="px-6 py-24">
        <div className="mx-auto max-w-6xl rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-10 text-center sm:p-16">

          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to join the game?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Create your player account and get access to the football
            platform.
          </p>

          <Link
            href="/auth/register"
            className={`mt-8 ${btnPrimary}`}
          >
            Register as a player
          </Link>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between lg:px-8">

          <p>
            © 2026 Mandala Futshal Arena. All rights reserved.
          </p>

          <div className="flex gap-6">

            <Link
              href="/auth/register"
              className="transition hover:text-white"
            >
              Register
            </Link>

            <Link
              href="/login"
              className="transition hover:text-white"
            >
              Login
            </Link>

          </div>
        </div>
      </footer>

    </main>
  );
}