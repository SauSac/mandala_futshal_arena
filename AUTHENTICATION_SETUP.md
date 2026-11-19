# BookIN authentication setup

BookIN uses Supabase Auth for phone/password registration, SMS OTP verification, and email-or-phone/password login.

## 1. Configure Supabase Auth

In your Supabase project:

1. Open **Authentication → Providers → Phone** and enable phone authentication.
2. Configure an SMS provider and its credentials. Supabase does not send SMS OTPs for free by itself; SMS delivery depends on the provider and its pricing/limits.
3. Enable phone confirmation so `signUp({ phone, password })` sends a verification code.
4. Open **Authentication → Settings** and set the phone OTP expiry to **120 seconds** (or the closest allowed value). The register page also shows a 120-second countdown, but the Supabase Auth setting is the server-side authority that actually expires codes.
5. Set the SMS message template to include the Supabase token variable, typically `{{ .Token }}`.
6. Under **Authentication → URL Configuration**, add your local and production site URLs, including the `/auth/reset-password` redirect URL.

## 2. Environment variables

Keep these in `.env.local` (never commit this file):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Restart the Next.js server after changing environment variables.

## 3. Required profile table and trigger

Run `supabase/migrations/202611120001_profiles_and_auth_trigger.sql` in the Supabase SQL Editor. It creates the minimal `profiles` table, a trigger that creates a default `player` profile after phone signup, and row-level security so users can read their own profile. It deliberately does not let users change their own role.

The Developer role must be assigned manually to the first trusted Developer account using the SQL comment at the bottom of that migration. Never accept a privileged role from public registration metadata.

## 4. Add an email after phone registration

The existing `/account/security` page lets a signed-in user add an email address and verify it with Supabase's `email_change` OTP flow. Configure Supabase email delivery and ensure email change confirmation is enabled. Once verified, the user can sign in with that email and the same password.

## 5. Important OTP limitation

The browser countdown is a user-interface aid, not a security boundary. Set the OTP expiry in Supabase itself to 120 seconds so an expired code is rejected by the authentication service even if someone bypasses the page timer.
