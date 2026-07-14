# DevFest Sydney

Public-facing website for DevFest Sydney, GDG Sydney's annual conference, including a full Call for Speakers (CfS) flow and an admin review panel.

See [`EVENT.md`](./EVENT.md) for event details (theme, tracks, special features) and [`PM.md`](./PM.md) for project scope, milestones, and current status.

## Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4 (config lives in `globals.css` via `@theme`, no `tailwind.config.ts`)
- **Database:** Firestore, via Firebase Admin SDK (server) and Firebase client SDK (client)
- **Auth:** Firebase Auth, Google sign-in, restricted to emails in the `admins` Firestore collection
- **Email:** Resend
- **Hosting:** Firebase App Hosting (Cloud Run backed)
- **Ticketing:** Humanitix (external, no in-house payments)

## Pages

| Route | Purpose |
|---|---|
| `/` | Hero, About, Tracks, FAQ (Speakers, Schedule, Venue, Sponsors, Team pending real content) |
| `/call-for-speakers` | CfS form, open/closed based on `CFS_OPEN` |
| `/code-of-conduct` | Static page |
| `/admin/login` | Google sign-in, restricted to authorised emails |
| `/admin` | Review CfS submissions, promote accepted speakers |

## Getting started

```bash
npm install
npm run dev
```

Requires a `.env.local` with the variables below. See [`PM.md`](./PM.md#milestone-3--responsibility-split) for who sets up the underlying Firebase project.

## Environment variables

| Variable | Purpose |
|---|---|
| `CFS_OPEN` | `true` to show the CfS form, `false` to show the closed message |
| `FIREBASE_PROJECT_ID` | Firebase project identifier |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client SDK |
| `RESEND_API_KEY` | Resend email sending |
| `RESEND_FROM_EMAIL` | Sender address for confirmation emails |
| `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` | Firebase App Check (reCAPTCHA Enterprise site key) |
| `NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN` | App Check debug token for local dev |

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint the codebase

## Contributing

Coding conventions, branding, and project rules live in [`CLAUDE.md`](./CLAUDE.md), [`BRANDING.md`](./BRANDING.md), and [`AGENTS.md`](./AGENTS.md).
