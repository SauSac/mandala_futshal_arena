import Link from "next/link";

type Role = "developer" | "manager" | "player";
const config = {
  developer: { title: "Developer Console", subtitle: "Platform overview and administration.", nav: ["Overview", "Players", "Arena managers", "Arenas", "Registrations", "Platform settings"], stats: [["Total players", "—"], ["Arena managers", "—"], ["Active arenas", "—"], ["Pending approvals", "—"]], actions: [["Manage players", "Review, create, suspend or update player accounts."], ["Manage managers", "Create manager accounts and control access."], ["Registration approvals", "Review offline registration payments."], ["Platform settings", "Configure registration fees and membership duration."]] },
  manager: { title: "Arena Manager", subtitle: "Manage your arena operations.", nav: ["Overview", "Bookings", "Availability", "Tournaments", "Arena profile"], stats: [["Today's bookings", "—"], ["Available slots", "—"], ["Upcoming matches", "—"], ["Monthly revenue", "—"]], actions: [["Bookings", "Review and manage incoming arena bookings."], ["Pitch availability", "Set operating hours and available time slots."], ["Tournaments", "Organise competitions and manage fixtures."], ["Arena profile", "Update your arena details and facilities."]] },
  player: { title: "Player Hub", subtitle: "Your game starts here.", nav: ["Overview", "Find arenas", "My bookings", "My teams", "Tournaments", "Account security"], stats: [["Upcoming bookings", "—"], ["Teams", "—"], ["Tournaments", "—"], ["Membership", "Check status"]], actions: [["Find an arena", "Discover pitches and find a time that works."], ["My bookings", "View your upcoming and past bookings."], ["Teams & tournaments", "Connect with teammates and enter competitions."], ["Account security", "Add and verify an email address for sign-in."]] },
} satisfies Record<Role, {title:string;subtitle:string;nav:string[];stats:string[][];actions:string[][]}>;

export default function Dashboard({ role }: { role: Role }) {
  const c = config[role];
  const hrefFor = (label: string) => label === "Account security" ? "/account/security" : label === "Overview" ? `/${role}/dashboard` : "#";
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--glass-b)] bg-[var(--bg-2)]/80 p-6 backdrop-blur-xl lg:block">
      <Link href="/" className="text-2xl font-black tracking-tight">Book<span className="text-[var(--accent)]">IN</span></Link>
      <p className="mt-2 text-[10px] font-bold tracking-[.2em] text-[var(--muted)]">{role.toUpperCase()} WORKSPACE</p>
      <nav className="mt-12 space-y-2">{c.nav.map(item=><Link key={item} href={hrefFor(item)} className="block rounded-xl px-4 py-3 text-sm text-[var(--muted)] transition hover:bg-[var(--glass)] hover:text-[var(--fg)]">{item}</Link>)}</nav>
      <Link href="/auth/login" className="absolute bottom-8 left-6 text-sm text-[var(--muted)] hover:text-[var(--fg)]">Sign out</Link>
    </aside>
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:ml-64 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--glass-b)] pb-7">
        <div><p className="text-xs font-bold tracking-[.2em] text-[var(--accent-text)]">BOOKIN / {role.toUpperCase()}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{c.title}</h1><p className="mt-2 text-sm text-[var(--muted)]">{c.subtitle}</p></div>
        <div className="flex gap-2"><Link href="/account/security" className="rounded-full border border-[var(--glass-b)] px-4 py-2 text-sm">Account</Link><Link href="/" className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black">Visit BookIN ↗</Link></div>
      </header>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{c.stats.map(([label,value])=><article key={label} className="rounded-2xl border border-[var(--glass-b)] bg-[var(--glass)] p-5 backdrop-blur-xl"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-4 text-3xl font-bold">{value}</p></article>)}</div>
      <div className="mt-12 flex items-end justify-between"><div><p className="text-xs font-bold tracking-[.2em] text-[var(--accent-text)]">WORKSPACE</p><h2 className="mt-2 text-2xl font-bold">Quick access</h2></div><span className="text-xs text-[var(--muted)]">More tools will appear as modules are connected</span></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{c.actions.map(([title,desc],i)=><article key={title} className="group rounded-2xl border border-[var(--glass-b)] bg-[var(--glass)] p-6 transition hover:-translate-y-1 hover:border-[var(--accent)]"><div className="flex items-center justify-between"><span className="text-xs font-bold tracking-widest text-[var(--accent-text)]">0{i+1}</span><span className="text-xl">↗</span></div><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{desc}</p></article>)}</div>
      <p className="mt-10 text-xs leading-6 text-[var(--muted)]">Dashboard interface scaffold. Live statistics and management actions will populate when the corresponding database tables and policies are connected.</p>
    </section>
  </main>;
}
