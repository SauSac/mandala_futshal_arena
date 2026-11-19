# BookIN authentication and dashboard setup

## Included
- Phone + password player registration using Supabase phone OTP.
- OTP verification and resend UI with a 120-second client countdown.
- Phone or email + password login.
- Email addition and verification page at `/account/security`.
- Starter role dashboards at `/developer/dashboard`, `/manager/dashboard`, and `/player/dashboard`.
- Server-side session checks on dashboard routes.

## Required Supabase configuration
1. Enable Phone authentication in Supabase Authentication > Providers.
2. Configure an SMS provider (for example Twilio) and verify that it can deliver to Nepal (+977).
3. Set the SMS OTP expiry in Supabase Auth settings to 60–120 seconds if your project/provider allows it. The UI countdown is only a convenience; Supabase is authoritative.
4. Ensure email authentication is enabled. Configure email OTP/confirmation templates and email delivery. Supabase may send a confirmation link rather than a numeric code depending on your Auth email template/settings.
5. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.

## Expected profile table
The code expects a `public.profiles` table with:
- `id uuid primary key references auth.users(id)`
- `full_name text`
- `role text` (developer, manager, player)

The authenticated user must be allowed by RLS to insert/update their own profile row. Dashboard role checks read `profiles.role` for the current user. Do not allow a public user to assign themselves `developer` or `manager`; enforce role assignment in a trusted database trigger or server-side admin workflow.

## Security notes
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in browser code.
- The dashboard pages verify that a user is signed in and redirect based on the role stored in `profiles`. For production, enforce role permissions in RLS policies and server-side actions for every protected operation; hiding dashboard links is not security.
- The 120-second browser countdown does not invalidate an OTP. The provider's expiry setting does.
- Email change verification can require one or two confirmation steps depending on Supabase Auth settings. The screen explains that behavior rather than claiming an email is verified before Supabase confirms it.

## Routes
- `/auth/login`
- `/auth/register`
- `/account/security`
- `/developer/dashboard`
- `/manager/dashboard`
- `/player/dashboard`
