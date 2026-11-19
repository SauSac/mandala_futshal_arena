# BookIN update notes

## Added
- `/about` — responsive About BookIN page.
- `/contact` — responsive contact page with a client-side form that prepares an email in the visitor's email application.
- Supplied BookIN logo copied to `public/brand/bookin-logo.png`.

## Updated
- Main navbar now links to `/about`, `/contact`, `/auth/login`, and `/auth/register`.
- Footer and authentication branding use the supplied BookIN logo.
- Authentication cross-links now consistently use `/auth/login` and `/auth/register`.
- Hero Join BookIN action now opens registration.
- Replaced the CSS 3D football geometry with a lightweight SVG football and smoother rotation.

## Contact form note
The contact form currently uses `mailto:bookin@gmail.com`; it does not submit to a server or store messages. Replace that address and connect a server-side email service/API when you are ready for messages to be delivered without requiring the visitor's email app.

## Existing project preserved
The original Next.js app, Supabase client setup, package manifest, dependencies, and existing homepage sections were retained.
