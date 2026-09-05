import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type Registration = {
  id: string;
  amount: number;
  payment_method: "online" | "offline";
  payment_status: "pending" | "approved" | "rejected";
  approved_at: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "developer" | "manager" | "player";
  is_suspended: boolean;
};

type PlatformSettings = {
  registration_fee: number;
  registration_duration_months: number;
};

export default async function PlayerDashboardPage() {
  const supabase = await createClient();

  // --------------------------------------------------
  // 1. Get logged-in user
  // --------------------------------------------------

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  // --------------------------------------------------
  // 2. Get player profile
  // --------------------------------------------------

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_suspended")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">
            Profile not found
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Your player profile could not be found. Please contact the
            platform Developer.
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // 3. Make sure this is actually a player account
  // --------------------------------------------------

  if (profile.role !== "player") {
    redirect("/auth/login");
  }

  // --------------------------------------------------
  // 4. Fetch latest player registration
  // --------------------------------------------------

  const { data: registration } = await supabase
    .from("player_registrations")
    .select(
      `
        id,
        amount,
        payment_method,
        payment_status,
        approved_at,
        starts_at,
        expires_at,
        created_at
      `,
    )
    .eq("player_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Registration>();

  // --------------------------------------------------
  // 5. Fetch platform settings
  // --------------------------------------------------

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("registration_fee, registration_duration_months")
    .limit(1)
    .maybeSingle<PlatformSettings>();

  const registrationFee =
    settings?.registration_fee !== undefined
      ? Number(settings.registration_fee)
      : null;

  const registrationDuration =
    settings?.registration_duration_months !== undefined
      ? Number(settings.registration_duration_months)
      : null;

  // --------------------------------------------------
  // 6. Determine membership status
  // --------------------------------------------------

  const now = new Date();

  const startsAt = registration?.starts_at
    ? new Date(registration.starts_at)
    : null;

  const expiresAt = registration?.expires_at
    ? new Date(registration.expires_at)
    : null;

  const isApproved =
    registration?.payment_status === "approved";

  const isActive =
    isApproved &&
    !!startsAt &&
    !!expiresAt &&
    startsAt <= now &&
    expiresAt > now;

  const isExpired =
    isApproved &&
    !!expiresAt &&
    expiresAt <= now;

  const isRejected =
    registration?.payment_status === "rejected";

  const isPending =
    !registration ||
    registration.payment_status === "pending";

  // --------------------------------------------------
  // 7. Format dates
  // --------------------------------------------------

  const formatDate = (date: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-NP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // --------------------------------------------------
  // 8. Format payment method
  // --------------------------------------------------

  const paymentMethod = registration?.payment_method
    ? registration.payment_method.charAt(0).toUpperCase() +
      registration.payment_method.slice(1)
    : "—";

  // --------------------------------------------------
  // 9. Display name
  // --------------------------------------------------

  const displayName =
    profile.full_name ||
    user.email ||
    "Player";

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

      {/* ================================================
          NAVBAR
      ================================================= */}

      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
              FA
            </div>

            <span className="font-semibold tracking-tight text-gray-900">
              Futsal Arena Portal
            </span>
          </div>

          <div className="flex items-center gap-4">

            <span className="hidden text-xs text-gray-500 sm:inline-block">
              Signed in as{" "}
              <strong className="text-gray-900">
                {displayName}
              </strong>
            </span>

            <form
              action={async () => {
                "use server";

                const sb = await createClient();

                await sb.auth.signOut();

                redirect("/auth/login");
              }}
            >
              <button
                type="submit"
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Sign Out
              </button>
            </form>

          </div>
        </div>
      </header>

      {/* ================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* Welcome */}

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome, {displayName}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your arena bookings, teams, and player membership.
          </p>
        </div>

        {/* ================================================
            MEMBERSHIP CARD
        ================================================= */}

        <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Membership Status
              </span>

              <h2 className="text-lg font-bold text-gray-900">

                {isActive
                  ? "Active Player Membership"
                  : isExpired
                    ? "Membership Expired"
                    : isRejected
                      ? "Registration Rejected"
                      : "Pending Developer Verification"}

              </h2>
            </div>

            {/* Status badge */}

            <div>

              {isActive ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active
                </span>

              ) : isExpired ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                  <span className="h-2 w-2 rounded-full bg-gray-500" />
                  Expired
                </span>

              ) : isRejected ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Rejected
                </span>

              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  Awaiting Review
                </span>
              )}

            </div>
          </div>

          {/* Registration details */}

          <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Payment Method
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {paymentMethod}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Amount Paid
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {registration
                  ? `Rs. ${Number(registration.amount).toFixed(2)}`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Membership Starts
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {formatDate(registration?.starts_at ?? null)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Membership Expires
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {formatDate(registration?.expires_at ?? null)}
              </p>
            </div>

          </div>

          {/* Dynamic platform information */}

          {registrationFee !== null && (
            <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">

              <div className="flex flex-wrap justify-between gap-2">

                <span>
                  Current registration fee
                </span>

                <strong className="text-gray-900">
                  Rs. {registrationFee.toFixed(2)}
                </strong>

              </div>

              {registrationDuration !== null && (
                <div className="mt-2 flex flex-wrap justify-between gap-2">

                  <span>
                    Registration duration
                  </span>

                  <strong className="text-gray-900">
                    {registrationDuration}{" "}
                    {registrationDuration === 1
                      ? "month"
                      : "months"}
                  </strong>

                </div>
              )}

            </div>
          )}

        </div>

        {/* ================================================
            FEATURES
        ================================================= */}

        <div className="grid gap-6 md:grid-cols-2">

          {/* ARENAS */}

          <div className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

            <div>

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-lg">
                🏟️
              </div>

              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Browse Arenas & Book Slots
              </h3>

              <p className="mb-6 text-sm leading-relaxed text-gray-500">
                Explore available football and futsal arenas, check
                availability, and book available slots.
              </p>

            </div>

            <div>

              {isActive ? (
                <Link
                  href="/dashboard/arenas"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-4 py-3.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                >
                  Browse Available Arenas
                </Link>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5 text-center text-xs font-medium text-gray-400">

                  {isExpired
                    ? "Renew your membership to book arenas."
                    : "Unlocked after registration approval."}

                </div>
              )}

            </div>
          </div>

          {/* TEAMS */}

          <div className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

            <div>

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-lg">
                ⚽
              </div>

              <h3 className="mb-2 text-lg font-bold text-gray-900">
                Teams & 1-vs-1 Matchups
              </h3>

              <p className="mb-6 text-sm leading-relaxed text-gray-500">
                Create or join teams, manage your squad, and participate
                in individual 1-vs-1 competitive matchups.
              </p>

            </div>

            <div>

              {isActive ? (
                <Link
                  href="/dashboard/teams"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-4 py-3.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                >
                  Manage Teams & Matches
                </Link>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5 text-center text-xs font-medium text-gray-400">

                  {isExpired
                    ? "Renew your membership to access teams."
                    : "Unlocked after registration approval."}

                </div>
              )}

            </div>
          </div>

        </div>

        {/* ================================================
            PENDING
        ================================================= */}

        {isPending && (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">

            <h3 className="font-semibold text-amber-900">
              Registration under review
            </h3>

            <p className="mt-1 text-sm leading-relaxed text-amber-800">

              {registration
                ? "Your registration payment is currently awaiting Developer verification. Arena bookings and team features will become available once your registration has been approved."
                : "No player registration has been found for your account. Please complete your registration before using arena and team features."}

            </p>

          </div>
        )}

        {/* ================================================
            REJECTED
        ================================================= */}

        {isRejected && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">

            <h3 className="font-semibold text-red-900">
              Registration rejected
            </h3>

            <p className="mt-1 text-sm leading-relaxed text-red-800">
              Your registration payment was rejected. Please contact the
              platform Developer for further instructions.
            </p>

          </div>
        )}

        {/* ================================================
            EXPIRED
        ================================================= */}

        {isExpired && (
          <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6">

            <h3 className="font-semibold text-gray-900">
              Membership expired
            </h3>

            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Your player membership expired on{" "}
              <strong>
                {formatDate(registration?.expires_at ?? null)}
              </strong>
              . A new registration will be required before you can book
              arenas or use team features.
            </p>

          </div>
        )}

      </main>
    </div>
  );
}

