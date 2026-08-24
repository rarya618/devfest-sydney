# DevFest Sydney

Public-facing website for DevFest Sydney, GDG Sydney's annual conference, including a full Call for Speakers (CfS) flow, a volunteer signup flow, and an admin review panel.

See [`EVENT.md`](./EVENT.md) for event details (theme, tracks, special features) and [`PM.md`](./PM.md) for project scope, milestones, and current status.

## Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4 (config lives in `globals.css` via `@theme`, no `tailwind.config.ts`)
- **Database:** Firestore, via Firebase Admin SDK (server) and Firebase client SDK (client)
- **Storage:** Firebase Storage, for images referenced from Firestore documents
- **Auth:** Firebase Auth, Google sign-in, restricted to emails in the `admins` Firestore collection
- **Email:** Resend
- **Analytics:** Google Analytics 4
- **Hosting:** Firebase App Hosting (Cloud Run backed)
- **Ticketing:** Humanitix (external, no in-house payments)

## Pages

| Route | Purpose |
|---|---|
| `/` | Hero, About, Tracks, FAQ (Speakers, Schedule, Venue, Sponsors, Team pending real content) |
| `/call-for-speakers` | CfS form, open/closed based on `CFS_OPEN` |
| `/volunteer` | Volunteer signup form, open/closed based on `VOLUNTEER_OPEN` |
| `/faq` | Dedicated FAQ page |
| `/conduct` | Code of Conduct, static page |
| `/privacy` | Privacy policy |
| `/admin/login` | Google sign-in, restricted to authorised emails |
| `/admin` | Review CfS submissions, promote accepted speakers |
| `/admin/volunteers` | Review volunteer signups (accept, reject, restore, archive) |
| `/admin/admins` | Manage authorised admin emails |
| `/admin/analytics` | Submission stats and trends |
| `/admin/links` | Generate UTM-tagged tracking links for the homepage and CfS page |

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
| `CFS_CLOSE_DATE` | Optional ISO datetime the CfS closes; powers the countdown timer, hidden if unset |
| `VOLUNTEER_OPEN` | `true` to show the volunteer signup form, `false` to show the closed message |
| `FIREBASE_PROJECT_ID` | Firebase project identifier |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase client SDK |
| `RESEND_API_KEY` | Resend email sending |
| `RESEND_FROM_EMAIL` | Sender address for confirmation emails |
| `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` | Firebase App Check (reCAPTCHA Enterprise site key) |
| `NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN` | App Check debug token for local dev (`true` to auto-generate, or a registered UUID) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata, sitemap, and robots.txt; defaults to `https://devfest.gdgsydney.com` |

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run start`: run the production build
- `npm run lint`: lint the codebase

## Contributing

Coding conventions, branding, and project rules live in [`CLAUDE.md`](./CLAUDE.md), [`BRANDING.md`](./BRANDING.md), and [`AGENTS.md`](./AGENTS.md).
