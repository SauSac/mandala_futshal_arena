"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = { mode: "login" | "register" };

const cleanPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("977")) return `+${digits}`;
  if (digits.startsWith("0")) return `+977${digits.slice(1)}`;
  return `+977${digits}`;
};
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isNepaliPhone = (value: string) => /^(\+977)?0?9[6-8]\d{8}$/.test(value.replace(/[\s()-]/g, ""));

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"details" | "verify">("details");
  const [seconds, setSeconds] = useState(120);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (stage !== "verify" || seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((remaining) => remaining - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [stage, seconds]);

  function goToRole(role?: string) {
    const destination = role === "developer" ? "/developer/dashboard"
      : role === "manager" ? "/manager/dashboard" : "/player/dashboard";
    router.replace(destination);
    router.refresh();
  }

  async function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (isRegister) {
      if (!fullName.trim()) return setErrorMessage("Enter your full name.");
      if (!isNepaliPhone(identifier)) return setErrorMessage("Enter a valid Nepali mobile number, for example 98XXXXXXXX.");
    } else if (!isEmail(identifier.trim()) && !isNepaliPhone(identifier)) {
      return setErrorMessage("Enter a valid email address or Nepali mobile number.");
    }
    if (password.length < 8) return setErrorMessage("Password must contain at least 8 characters.");
    if (isRegister && password !== confirmPassword) return setErrorMessage("Your passwords do not match.");

    setBusy(true);
    try {
      const supabase = createClient();
      if (isRegister) {
        const phone = cleanPhone(identifier);
        const { error } = await supabase.auth.signUp({
          phone,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        setIdentifier(phone);
        setStage("verify");
        setSeconds(120);
        setOtp("");
        setMessage(`A verification code has been requested for ${phone}.`);
      } else {
        const contact = identifier.trim();
        const result = isEmail(contact)
          ? await supabase.auth.signInWithPassword({ email: contact, password })
          : await supabase.auth.signInWithPassword({ phone: cleanPhone(contact), password });
        if (result.error) throw result.error;

        // Role comes from the protected database profile, never from editable signup metadata.
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", result.data.user.id)
          .maybeSingle();
        goToRole(profile?.role);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to continue. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  
async function verifyPhone(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (seconds <= 0) {
    return setErrorMessage("OTP expired. Request a new OTP.");
  }

  if (!/^\d{6}$/.test(otp)) {
    return setErrorMessage("Enter the 6-digit verification code.");
  }

  setBusy(true);
  setErrorMessage("");
  setMessage("");

  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      phone: cleanPhone(identifier),
      token: otp,
      type: "sms",
    });

    if (error) throw error;

    // Ensure Supabase returned an authenticated user.
    if (!data.user) {
      throw new Error(
        "Verification succeeded, but no user was returned. Please sign in again."
      );
    }

    // Retrieve the role from the database profile.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    goToRole(profile?.role ?? "player");
  } catch (error) {
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "The code could not be verified."
    );
  } finally {
    setBusy(false);
  }
}


  async function resendOtp() {
    setBusy(true);
    setErrorMessage("");
    setMessage("");
    try {
      const { error } = await createClient().auth.resend({
        type: "sms",
        phone: cleanPhone(identifier),
      });
      if (error) throw error;
      setSeconds(120);
      setOtp("");
      setMessage("A new verification code has been requested.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not resend OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    setErrorMessage("");
    setMessage("");
    if (!isEmail(identifier.trim())) {
      return setErrorMessage("Enter your account email address first. Phone password recovery needs a separate SMS recovery flow.");
    }
    setBusy(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(identifier.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setMessage("If the account exists, a password reset email has been sent.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to send reset email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-form-content">
      <div className="auth-form-heading">
        <p className="auth-form-eyebrow">{stage === "verify" ? "PHONE VERIFICATION" : isRegister ? "START YOUR JOURNEY" : "WELCOME BACK"}</p>
        <h2>{stage === "verify" ? <>Verify your<br /><span>mobile number.</span></> : isRegister ? <>Create your<br /><span>BookIN account.</span></> : <>Good to have<br /><span>you back.</span></>}</h2>
        <p className="auth-form-subtitle">
          {stage === "verify"
            ? `Enter the 6-digit code sent to ${identifier}.`
            : isRegister
              ? "Create your account with a Nepali phone number. You can add a verified email later."
              : "Sign in with your verified email address or Nepali mobile number."}
        </p>
      </div>

      {stage === "verify" ? (
        <form className="auth-form" onSubmit={verifyPhone}>
          <label className="auth-field">
            <span>6-DIGIT OTP</span>
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </label>
          <p className="auth-secure-note">
            {seconds > 0
              ? `OTP expires in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
              : "OTP expired. Send a new OTP to continue."}
          </p>
          {errorMessage && <p className="auth-feedback auth-feedback-error" role="alert">{errorMessage}</p>}
          {message && <p className="auth-feedback auth-feedback-success" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={busy || seconds <= 0}>
            <span>{busy ? "VERIFYING..." : "VERIFY & CREATE ACCOUNT"}</span>
          </button>
          <button className="auth-text-button" type="button" onClick={resendOtp} disabled={busy}>
            {seconds <= 0 ? "Send a new OTP" : "Resend OTP"}
          </button>
          <button className="auth-text-button" type="button" onClick={() => { setStage("details"); setOtp(""); setErrorMessage(""); setMessage(""); }} disabled={busy}>
            Change phone number
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={submitDetails} noValidate>
          {isRegister && (
            <label className="auth-field">
              <span>FULL NAME</span>
              <input autoComplete="name" placeholder="Your full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>
          )}
          <label className="auth-field">
            <span>{isRegister ? "NEPALI PHONE NUMBER" : "EMAIL OR PHONE NUMBER"}</span>
            <input
              autoComplete="username"
              inputMode={isRegister ? "tel" : "email"}
              placeholder={isRegister ? "98XXXXXXXX" : "you@example.com or 98XXXXXXXX"}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </label>
          <label className="auth-field">
            <span>PASSWORD</span>
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          {isRegister ? (
            <label className="auth-field">
              <span>CONFIRM PASSWORD</span>
              <input autoComplete="new-password" type="password" placeholder="Enter password again" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            </label>
          ) : (
            <div className="auth-form-options">
              <span className="auth-secure-note"><span /> Secure sign in</span>
              <button type="button" className="auth-text-button" onClick={forgotPassword} disabled={busy}>Forgot password?</button>
            </div>
          )}
          {errorMessage && <p className="auth-feedback auth-feedback-error" role="alert">{errorMessage}</p>}
          {message && <p className="auth-feedback auth-feedback-success" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>
            <span>{busy ? "PLEASE WAIT..." : isRegister ? "SEND VERIFICATION OTP" : "SIGN IN"}</span>
            <span className="auth-submit-arrow">↗</span>
          </button>
        </form>
      )}

      <p className="auth-switch">
        {isRegister ? "Already have an account?" : "New to BookIN?"}{" "}
        <Link href={isRegister ? "/auth/login" : "/auth/register"}>{isRegister ? "Sign in" : "Create an account"}</Link>
      </p>
      <div className="auth-divider"><span>BUILT FOR EVERY PLAYER</span></div>
      <p className="auth-bottom-note">Discover your arena. Book your slot. Make it count.</p>
    </div>
  );
}
