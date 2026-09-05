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

  // =====================================================
  // 1. AUTHENTICATION
  // =====================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // =====================================================
  // 2. PLAYER PROFILE
  // =====================================================

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_suspended")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl">
            !
          </div>

          <h1 className="mt-5 text-xl font-bold text-gray-900">
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

  // Only players can access this dashboard.
  if (profile.role !== "player") {
    redirect("/auth/login");
  }

  // =====================================================
  // 3. REGISTRATION
  // =====================================================

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

  // =====================================================
  // 4. PLATFORM SETTINGS
  // =====================================================

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

  // =====================================================
  // 5. MEMBERSHIP STATUS
  // =====================================================

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
    expiresAt > now &&
    !profile.is_suspended;

  const isExpired =
    isApproved &&
    !!expiresAt &&
    expiresAt <= now;

  const isRejected =
    registration?.payment_status === "rejected";

  const isPending =
    !registration ||
    registration.payment_status === "pending";

  // =====================================================
  // 6. DAYS REMAINING
  // =====================================================

  let daysRemaining = 0;

  if (isActive && expiresAt) {
    const difference =
      expiresAt.getTime() - now.getTime();

    daysRemaining = Math.max(
      0,
      Math.ceil(
        difference / (1000 * 60 * 60 * 24),
      ),
    );
  }

  // =====================================================
  // 7. HELPERS
  // =====================================================

  const formatDate = (date: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-NP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const paymentMethod = registration?.payment_method
    ? registration.payment_method.charAt(0).toUpperCase() +
      registration.payment_method.slice(1)
    : "—";

  const displayName =
    profile.full_name ||
    user.email ||
    "Player";

  // =====================================================
  // 8. PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

      {/* =================================================
          NAVBAR
      ================================================== */}

      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">

          {/* Brand */}

          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-xs font-bold text-white">
              FA
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight text-gray-900">
                Futsal Arena
              </p>

              <p className="hidden text-[10px] font-medium text-gray-400 sm:block">
                Player Portal
              </p>
            </div>
          </Link>

          {/* User */}

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-gray-900">
                {displayName}
              </p>

              <p className="text-[10px] text-gray-400">
                Player
              </p>
            </div>

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

      {/* =================================================
          MAIN
      ================================================== */}

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:py-10">

        {/* =================================================
            WELCOME
        ================================================== */}

        <section className="mb-8">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Player Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Welcome, {displayName}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            Manage your membership, arena bookings, teams, and
            competitive matches from one place.
          </p>

        </section>

        {/* =================================================
            SUSPENDED WARNING
        ================================================== */}

        {profile.is_suspended && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5">

            <div className="flex gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 font-bold text-red-700">
                !
              </div>

              <div>
                <h2 className="font-semibold text-red-900">
                  Account suspended
                </h2>

                <p className="mt-1 text-sm leading-relaxed text-red-800">
                  Your account has been suspended by the platform
                  Developer. Arena bookings, teams, and tournament
                  features are currently unavailable.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* =================================================
            MEMBERSHIP OVERVIEW
        ================================================== */}

        <section className="mb-8 rounded-3xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6 sm:p-8">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Membership
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">

                  {isActive
                    ? "Active Player Membership"
                    : isExpired
                      ? "Membership Expired"
                      : isRejected
                        ? "Registration Rejected"
                        : "Registration Pending"}

                </h2>

              </div>

              {/* Status */}

              {isActive ? (
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active
                </div>
              ) : isExpired ? (
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600">
                  <span className="h-2 w-2 rounded-full bg-gray-500" />
                  Expired
                </div>
              ) : isRejected ? (
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Rejected
                </div>
              ) : (
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  Awaiting Review
                </div>
              )}

            </div>

          </div>

          {/* Membership information */}

          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">

            <div className="border-b border-gray-100 p-6 sm:border-r lg:border-b-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Payment Method
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {paymentMethod}
              </p>
            </div>

            <div className="border-b border-gray-100 p-6 lg:border-r lg:border-b-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Amount
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {registration
                  ? `Rs. ${Number(registration.amount).toFixed(2)}`
                  : "—"}
              </p>
            </div>

            <div className="border-b border-gray-100 p-6 sm:border-r sm:border-b-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Started
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {formatDate(registration?.starts_at ?? null)}
              </p>
            </div>

            <div className="p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Expires
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {formatDate(registration?.expires_at ?? null)}
              </p>
            </div>

          </div>

          {/* Active countdown */}

          {isActive && (
            <div className="border-t border-gray-100 bg-gray-50 p-6">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Membership remaining
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    Your membership is currently active.
                  </p>
                </div>

                <div className="text-left sm:text-right">

                  <p className="text-2xl font-bold text-gray-900">
                    {daysRemaining}
                  </p>

                  <p className="text-xs text-gray-400">
                    {daysRemaining === 1
                      ? "day remaining"
                      : "days remaining"}
                  </p>

                </div>

              </div>

            </div>
          )}

        </section>

        {/* =================================================
            MAIN FEATURES
        ================================================== */}

        <section>

          <div className="mb-4">

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Player Services
            </p>

            <h2 className="mt-1 text-lg font-bold text-gray-900">
              What would you like to do?
            </h2>

          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {/* ARENAS */}

            <FeatureCard
              icon="🏟️"
              iconBackground="bg-emerald-50"
              title="Arenas & Bookings"
              description="Browse registered arenas, check available slots, and make bookings."
              href="/dashboard/arenas"
              enabled={isActive}
              disabledText={
                isExpired
                  ? "Renew your membership to book an arena."
                  : "Available after registration approval."
              }
              buttonText="Browse Arenas"
            />

            {/* TEAMS */}

            <FeatureCard
              icon="⚽"
              iconBackground="bg-blue-50"
              title="Teams"
              description="Create your own team, join teams, and manage your football squad."
              href="/dashboard/teams"
              enabled={isActive}
              disabledText={
                isExpired
                  ? "Renew your membership to manage teams."
                  : "Available after registration approval."
              }
              buttonText="Manage Teams"
            />

            {/* TOURNAMENTS */}

            <FeatureCard
              icon="🏆"
              iconBackground="bg-amber-50"
              title="1v1 Competitions"
              description="View available individual competitions and see your upcoming matchups."
              href="/dashboard/tournaments"
              enabled={isActive}
              disabledText={
                isExpired
                  ? "Renew your membership to enter competitions."
                  : "Available after registration approval."
              }
              buttonText="View Competitions"
            />

          </div>

        </section>

        {/* =================================================
            QUICK INFORMATION
        ================================================== */}

        <section className="mt-8 grid gap-5 lg:grid-cols-2">

          {/* ACCOUNT */}

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Account
            </p>

            <h2 className="mt-1 text-lg font-bold text-gray-900">
              Player Information
            </h2>

            <div className="mt-5 space-y-4">

              <InfoRow
                label="Full Name"
                value={profile.full_name || "Not provided"}
              />

              <InfoRow
                label="Email"
                value={profile.email || user.email || "Not provided"}
              />

              <InfoRow
                label="Account Type"
                value="Player"
              />

              <InfoRow
                label="Account Status"
                value={
                  profile.is_suspended
                    ? "Suspended"
                    : "Active"
                }
              />

            </div>

          </div>

          {/* REGISTRATION */}

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Registration
            </p>

            <h2 className="mt-1 text-lg font-bold text-gray-900">
              Registration Information
            </h2>

            <div className="mt-5 space-y-4">

              <InfoRow
                label="Registration Status"
                value={
                  registration?.payment_status
                    ? registration.payment_status
                        .charAt(0)
                        .toUpperCase() +
                      registration.payment_status.slice(1)
                    : "Not registered"
                }
              />

              <InfoRow
                label="Submitted"
                value={formatDate(
                  registration?.created_at ?? null,
                )}
              />

              <InfoRow
                label="Approved"
                value={formatDate(
                  registration?.approved_at ?? null,
                )}
              />

              {registrationFee !== null && (
                <InfoRow
                  label="Current Registration Fee"
                  value={`Rs. ${registrationFee.toFixed(2)}`}
                />
              )}

              {registrationDuration !== null && (
                <InfoRow
                  label="Registration Duration"
                  value={`${registrationDuration} ${
                    registrationDuration === 1
                      ? "month"
                      : "months"
                  }`}
                />
              )}

            </div>

          </div>

        </section>

        {/* =================================================
            PENDING
        ================================================== */}

        {isPending && (
          <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">

            <div className="flex gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                ⏳
              </div>

              <div>

                <h3 className="font-semibold text-amber-900">
                  Registration under review
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-amber-800">

                  {registration
                    ? "Your registration payment is awaiting Developer verification. Arena bookings, teams, and competitions will become available after approval."
                    : "You do not currently have a player registration. Complete your registration before using player services."}

                </p>

                {!registration && (
                  <Link
                    href="/auth/register"
                    className="mt-4 inline-flex rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                  >
                    Complete Registration
                  </Link>
                )}

              </div>

            </div>

          </section>
        )}

        {/* =================================================
            REJECTED
        ================================================== */}

        {isRejected && (
          <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">

            <h3 className="font-semibold text-red-900">
              Registration rejected
            </h3>

            <p className="mt-1 text-sm leading-relaxed text-red-800">
              Your registration payment was rejected. Please
              contact the platform Developer for further
              instructions.
            </p>

          </section>
        )}

        {/* =================================================
            EXPIRED
        ================================================== */}

        {isExpired && (
          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

            <h3 className="font-semibold text-gray-900">
              Membership expired
            </h3>

            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Your player membership expired on{" "}
              <strong>
                {formatDate(
                  registration?.expires_at ?? null,
                )}
              </strong>
              . You will need a new approved registration
              before booking arenas, managing teams, or
              participating in competitions.
            </p>

          </section>
        )}

        {/* =================================================
            FOOTER
        ================================================== */}

        <footer className="mt-12 border-t border-gray-200 pt-6 text-center">

          <p className="text-xs text-gray-400">
            Futsal Arena Player Portal
          </p>

        </footer>

      </main>
    </div>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
  icon,
  iconBackground,
  title,
  description,
  href,
  enabled,
  disabledText,
  buttonText,
}: {
  icon: string;
  iconBackground: string;
  title: string;
  description: string;
  href: string;
  enabled: boolean;
  disabledText: string;
  buttonText: string;
}) {
  return (
    <div className="flex min-h-[270px] flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">

      <div>

        <div
          className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${iconBackground} text-lg`}
        >
          {icon}
        </div>

        <h3 className="text-lg font-bold text-gray-900">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          {description}
        </p>

      </div>

      <div className="mt-6">

        {enabled ? (
          <Link
            href={href}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-4 py-3.5 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            {buttonText}
          </Link>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5 text-center text-xs font-medium text-gray-400">
            {disabledText}
          </div>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0">

      <span className="text-xs font-medium text-gray-400">
        {label}
      </span>

      <span className="max-w-[60%] truncate text-right text-sm font-semibold text-gray-900">
        {value}
      </span>

    </div>
  );
}