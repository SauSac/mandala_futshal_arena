"use client";
import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const subject = String(data.get("subject") || "BookIN enquiry").trim();
    const message = String(data.get("message") || "").trim();
    if (!name || !email || !message) { setStatus("Please complete your name, email and message."); return; }
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    window.location.href = `mailto:bookin@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus("Your email app should open with the message ready to send.");
    event.currentTarget.reset();
  }
  return <form onSubmit={submit} className="contact-form glass rounded-3xl p-6 sm:p-8">
    <div className="grid gap-5 sm:grid-cols-2">
      <label><span>Your name</span><input name="name" autoComplete="name" placeholder="Full name" required /></label>
      <label><span>Email address</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
    </div>
    <label className="mt-5 block"><span>Subject</span><input name="subject" placeholder="How can we help?" /></label>
    <label className="mt-5 block"><span>Message</span><textarea name="message" rows={6} placeholder="Tell us a little about your question..." required /></label>
    {status && <p role="status" className="mt-4 text-sm text-accent-text">{status}</p>}
    <button type="submit" className="btn btn-primary mt-6">Prepare message <span aria-hidden>↗</span></button>
    <p className="mt-3 text-xs leading-relaxed text-muted">This form opens your device's email application. It does not send or store your message on this website.</p>
  </form>;
}
