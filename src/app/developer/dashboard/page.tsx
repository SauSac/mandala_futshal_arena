import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddPlayersForm from "@/components/add-players-form";
import { updateRegistrationStatus } from "@/app/actions/developer";

export default async function DeveloperDashboardPage() {
  const supabase = await createClient();

  // ==================================================
  // AUTHENTICATE DEVELOPER
  // ==================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/developer/login");
  }

  // Verify Developer role server-side
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    profile.role !== "developer" ||
    profile.is_suspended
  ) {
    redirect("/developer/login");
  }

  // ==================================================
  // FETCH PENDING REGISTRATIONS
  // ==================================================

  const { data: pendingRegistrations } = await supabase
    .from("player_registrations")
    .select(`
      id,
      amount,
      payment_method,
      payment_status,
      created_at,
      profiles:player_id (
        full_name,
        email
      )
    `)
    .eq("payment_status", "pending")
    .order("created_at", { ascending: false });

  // ==================================================
  // FETCH BASIC PLATFORM COUNTS
  // ==================================================

  const { count: playerCount } = await supabase
    .from("profiles")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("role", "player");

  const { count: arenaCount } = await supabase
    .from("arenas")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("is_active", true);

  const { count: tournamentCount } = await supabase
    .from("tournaments")
    .select("*", {
      count: "exact",
      head: true,
    });

  return (
    <div className="min-h-screen bg-gray-950 p-6 font-sans text-white lg:p-12">
      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-4 border-b border-gray-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Developer Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Manage players, arenas, registrations,
              tournaments, and platform operations.
            </p>
          </div>

          {/* SIGN OUT */}

          <form
            action={async () => {
              "use server";

              const sb = await createClient();

              await sb.auth.signOut();

              redirect("/developer/login");
            }}
          >
            <button
              type="submit"
              className="rounded-xl bg-gray-800 px-4 py-2 text-xs font-medium transition-all hover:bg-gray-700"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* ==================================================
            PLATFORM OVERVIEW
        ================================================== */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* PLAYERS */}

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Players
            </p>

            <p className="mt-2 text-3xl font-bold">
              {playerCount ?? 0}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Registered player accounts
            </p>
          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-400">
              {pendingRegistrations?.length ?? 0}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Registrations awaiting approval
            </p>
          </div>

          {/* ARENAS */}

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Active Arenas
            </p>

            <p className="mt-2 text-3xl font-bold">
              {arenaCount ?? 0}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Currently active arenas
            </p>
          </div>

          {/* TOURNAMENTS */}

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Tournaments
            </p>

            <p className="mt-2 text-3xl font-bold">
              {tournamentCount ?? 0}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Tournaments created
            </p>
          </div>
        </div>

        {/* ==================================================
            MANAGEMENT
        ================================================== */}

        <div className="mb-8">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Platform Management
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {/* TOURNAMENTS */}

            <a
              href="/developer/tournaments"
              className="group rounded-2xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-700 hover:bg-gray-900/80"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl">
                  🏆
                </span>

                <span className="text-xs text-gray-600 transition group-hover:text-gray-400">
                  Open →
                </span>
              </div>

              <h3 className="font-semibold">
                1v1 Tournaments
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Create fixed knockout brackets and manually
                record match winners.
              </p>
            </a>

            {/* ARENAS */}

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 opacity-70">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl">
                  🏟️
                </span>

                <span className="rounded-full border border-gray-800 bg-gray-950 px-2 py-1 text-[10px] uppercase tracking-wider text-gray-600">
                  Coming Soon
                </span>
              </div>

              <h3 className="font-semibold">
                Arena Management
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add arenas, configure prices, manage
                availability, and activate or suspend arenas.
              </p>
            </div>

            {/* MANAGERS */}

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 opacity-70">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl">
                  👤
                </span>

                <span className="rounded-full border border-gray-800 bg-gray-950 px-2 py-1 text-[10px] uppercase tracking-wider text-gray-600">
                  Coming Soon
                </span>
              </div>

              <h3 className="font-semibold">
                Arena Managers
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Assign managers to arenas and control
                manager access.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            ADD PLAYER
        ================================================== */}

        <div className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Add Player
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create a player account directly without
              sending an email confirmation.
            </p>
          </div>

          <AddPlayersForm />
        </div>

        {/* ==================================================
            PENDING REGISTRATIONS
        ================================================== */}

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
            <span>
              Pending Registrations
            </span>

            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs text-red-400">
              {pendingRegistrations?.length ?? 0}
            </span>
          </h2>

          {!pendingRegistrations ||
          pendingRegistrations.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-8 text-center">
              <p className="text-sm text-gray-500">
                No pending registrations to approve.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">

                <thead>
                  <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">
                      Player
                    </th>

                    <th className="px-4 py-3">
                      Email
                    </th>

                    <th className="px-4 py-3">
                      Amount
                    </th>

                    <th className="px-4 py-3">
                      Method
                    </th>

                    <th className="px-4 py-3">
                      Submitted
                    </th>

                    <th className="px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-800">

                  {pendingRegistrations.map((reg: any) => (

                    <tr
                      key={reg.id}
                      className="transition-colors hover:bg-gray-800/50"
                    >

                      {/* PLAYER */}

                      <td className="px-4 py-4 font-medium text-white">
                        {reg.profiles?.full_name ||
                          "N/A"}
                      </td>

                      {/* EMAIL */}

                      <td className="px-4 py-4 text-gray-400">
                        {reg.profiles?.email ||
                          "N/A"}
                      </td>

                      {/* AMOUNT */}

                      <td className="px-4 py-4 font-semibold text-emerald-400">
                        Rs. {reg.amount}
                      </td>

                      {/* PAYMENT METHOD */}

                      <td className="px-4 py-4 capitalize">
                        <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                          {reg.payment_method}
                        </span>
                      </td>

                      {/* CREATED */}

                      <td className="px-4 py-4 text-xs text-gray-500">
                        {new Date(
                          reg.created_at
                        ).toLocaleString()}
                      </td>

                      {/* ACTIONS */}

                      <td className="space-x-2 px-4 py-4 text-right">

                        {/* APPROVE */}

                        <form
                          action={async () => {
                            "use server";

                            await updateRegistrationStatus(
                              reg.id,
                              "approved"
                            );
                          }}
                          className="inline"
                        >
                          <button
                            type="submit"
                            className="rounded-lg border border-emerald-500/30 bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-600/30"
                          >
                            Approve
                          </button>
                        </form>

                        {/* REJECT */}

                        <form
                          action={async () => {
                            "use server";

                            await updateRegistrationStatus(
                              reg.id,
                              "rejected"
                            );
                          }}
                          className="inline"
                        >
                          <button
                            type="submit"
                            className="rounded-lg border border-red-500/30 bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-600/30"
                          >
                            Reject
                          </button>
                        </form>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
