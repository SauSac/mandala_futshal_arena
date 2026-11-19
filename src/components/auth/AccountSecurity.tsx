"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountSecurity() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"email" | "verify">("email");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/auth/login");
      else setEmail(data.user.email ?? "");
    });
  }, [router]);
  async function send(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const { error } = await createClient().auth.updateUser({ email: email.trim() });
      if (error) throw error;
      setStage("verify");
      setMessage("A confirmation code or link has been sent to the new email address. Follow your Supabase email confirmation settings.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update email."); }
    finally { setBusy(false); }
  }
  async function verify(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const { error } = await createClient().auth.verifyOtp({ email: email.trim(), token: otp.trim(), type: "email_change" });
      if (error) throw error;
      setMessage("Email verified and added to your account."); setStage("email");
    } catch (e) { setError(e instanceof Error ? e.message : "Email verification failed."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen px-5 py-12 text-[var(--fg)]"><div className="mx-auto max-w-xl rounded-3xl border border-[var(--glass-b)] bg-[var(--glass)] p-7 shadow-2xl backdrop-blur-xl sm:p-10">
    <Link href="/player/dashboard" className="text-sm text-[var(--accent-text)]">← Back to dashboard</Link>
    <p className="mt-8 text-xs font-bold tracking-[.2em] text-[var(--accent-text)]">ACCOUNT SECURITY</p>
    <h1 className="mt-3 text-3xl font-bold">Add an email address</h1>
    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Your phone number remains your primary sign-in method. Verify an email to use it for future sign-ins too.</p>
    <form className="mt-8 space-y-5" onSubmit={stage === "email" ? send : verify}>
      <label className="block text-xs font-semibold tracking-widest">EMAIL ADDRESS
        <input className="mt-2 w-full rounded-xl border border-[var(--glass-b)] bg-[var(--bg-2)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      {stage === "verify" && <label className="block text-xs font-semibold tracking-widest">EMAIL OTP
        <input className="mt-2 w-full rounded-xl border border-[var(--glass-b)] bg-[var(--bg-2)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]" inputMode="numeric" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter verification code" required />
      </label>}
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      {message && <p className="text-sm text-[var(--accent-text)]" role="status">{message}</p>}
      <button disabled={busy} className="w-full rounded-full bg-[var(--accent)] px-5 py-3 font-bold text-black disabled:opacity-50">{busy ? "PLEASE WAIT..." : stage === "email" ? "SEND EMAIL VERIFICATION" : "VERIFY EMAIL"}</button>
    </form>
  </div></main>;
}
