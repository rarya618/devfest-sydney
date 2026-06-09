# DevFest Sydney

@AGENTS.md
@EVENT.md
@BRANDING.md
@PM.md

## Session Startup

At the start of every session:
1. State the active milestone and the next concrete task from `PM.md`
2. Flag any blockers (missing env vars, unresolved dependencies, unclear requirements)
3. Don't wait to be asked — suggest the next step after completing any task

## Coding Conventions

- **App Router only** — all pages and layouts use the Next.js App Router (`src/app/`). No Pages Router patterns.
- **Server components by default** — only add `'use client'` when the component needs interactivity (state, effects, event handlers).
- **Component location** — shared components go in `src/components/`. Page-specific components stay co-located in the route folder.
- **Tailwind for styling** — use Tailwind classes as the first and default approach. Only fall back to inline styles, `globals.css`, or custom CSS when a class genuinely cannot express the style needed. No separate CSS modules or styled-components.
- **Tailwind v4** — this project uses Tailwind v4. Always refer to v4 docs. Config lives in `globals.css` via `@theme` — there is no `tailwind.config.ts`.
- **Google brand colors** — always use the Tailwind utilities (`text-google-blue`, `bg-google-red`, etc.) rather than hardcoded hex values. Refer to `BRANDING.md` for the full palette.
- **Font usage** — `font-sans` (Google Sans) for all UI text, `font-mono` (Roboto Mono) for code-style accents, data labels, and short metadata lines.
- **TypeScript strictly** — no `any` types. Define interfaces for all Firestore document shapes.
- **Descriptive variable names** — names should clearly communicate intent. Avoid single-letter variables, abbreviations, and generic names like `data`, `item`, or `temp`.

## Rules

- **Never hardcode secrets.** Use `.env.local` locally and Firebase App Hosting environment variables in production.
- **Firebase Admin SDK server-side only.** Never import `firebase-admin` in client components.
- **Firebase client SDK for client-side needs.** Use `@/lib/firebase` (client config) in `'use client'` components.
- **All dynamic content via Firestore.** No hardcoded speaker, schedule, sponsor, team, or FAQ data in source code.
- **No in-house payments.** Ticketing is handled by Humanitix. Never build payment flows.
- **Scope discipline.** Don't add features beyond what's in `PM.md` without checking first.
- **Env var discipline.** Whenever a new integration is added, list its required env vars immediately.

## Library Preferences

| Need | Use |
|------|-----|
| Email | Resend (`resend` npm package) |
| Database | Firestore via Firebase Admin SDK (server) / Firebase client SDK (client) |
| Auth | Firebase Auth with Google sign-in provider |
| Forms | React controlled components + native validation — no form libraries unless complexity demands it |
| Styling | Tailwind CSS |
| Fonts | `next/font/local` for Google Sans; Google Fonts CDN for Roboto Mono |
