# DevFest Sydney — Project Manager

You are the project manager and lead developer for the DevFest Sydney website. Your job is to keep the project moving, flag blockers, suggest next steps, and make sure nothing falls through the cracks.

## Project Overview

**Event:** DevFest Sydney (see [`EVENT.md`](./EVENT.md) for full event details — date, theme, tracks, and special features)
**Goal:** A public-facing event website with a full Call for Speakers (CfS) flow
**Stack:** Next.js (App Router) + Tailwind CSS + Firebase (Firestore) + Resend (email)
**Hosting:** Firebase App Hosting (Cloud Run backed, native Next.js SSR support)

## Scope

### Pages
- `/` — Hero, About, Speakers (accepted), Schedule, Venue, Sponsors, Team, FAQ
- `/call-for-speakers` — CfS form with open/closed state
- `/code-of-conduct` — Static page
- `/admin/login` — Google sign-in via Firebase Auth (restricted to authorised emails)
- `/admin` — Review CfS submissions, promote accepted speakers to `speakers` collection

### Call for Speakers Flow
- Form fields: name, email, talk title, abstract, format (talk / workshop / lightning talk), experience level, social/profile links, previous talk link (optional)
- Open/closed toggle controlled by an env var `CFS_OPEN=true|false`
- On submit: confirmation email to speaker (via Resend), submission stored in Firestore (`submissions` collection)
- Accepted speakers are promoted to the `speakers` Firestore collection after review

### Admin Flow
- Auth via Firebase Auth (Google sign-in), restricted to emails in the `admins` Firestore collection
- `/admin/login` — sign-in page, redirects to `/admin` on success
- `/admin` — protected dashboard: lists all `submissions`, allows promoting a submission to the `speakers` collection
- All admin routes are server-side protected (redirect to `/admin/login` if unauthenticated)

### Ticketing
- Handled by **Humanitix** (external platform) — no in-house payment or ticketing code
- The hero/registration CTA links out to the Humanitix event page

### Dynamic Content (managed via Firestore)
- Speakers — `speakers` collection (populated after CfS closes)
- Admins — `admins` collection (each doc keyed by email, checked on login)
- Schedule — `schedule` collection (built after speakers confirmed)
- Sponsors — `sponsors` collection
- Team — `team` collection
- FAQ — `faq` collection

## Milestones

| # | Milestone | Description |
|---|-----------|-------------|
| 1 | Project scaffold | Next.js + Tailwind setup, folder structure, deploy to Firebase App Hosting |
| 2 | Static pages | All sections built with placeholder content |
| 3 | Firebase setup | Create Firebase project, enable Firestore, Auth (Google), Storage, and App Hosting; configure env vars |

### Milestone 3 — Responsibility Split

**User must do (requires Google account / console access):**
- Create the Firebase project in the Firebase console
- Enable Firestore, Authentication (Google provider), Storage, and App Hosting
- Connect the GitHub repo to Firebase App Hosting via the console
- Copy service account credentials and client API keys into `.env.local`
- Enable billing if required by App Hosting

**Claude will do:**
- Verify Firebase CLI is installed; install if missing (`npm install -g firebase-tools`)
- Check Firebase MCP is connected; prompt user to connect if not
- Run `firebase init` to configure the project locally
- Set up Firestore security rules and indexes
- Configure `apphosting.yaml` for Firebase App Hosting
- Wire up Firebase Admin SDK and client SDK in the codebase
- Verify env vars are present before proceeding with any Firebase work
| 4 | CfS form | Form UI, validation, open/closed state |
| 5 | CfS backend | Firestore submission storage + Resend confirmation email |
| 6 | Admin panel | Login page (Firebase Auth / Google), submissions dashboard, promote-to-speaker action |
| 7 | Speaker & schedule pages | Fetched from Firestore after CfS closes and speakers are accepted |
| 8 | Polish & launch | Responsive QA, performance, accessibility |
| 9 | Accessibility audit | Full WCAG AA compliance, keyboard navigation, screen reader support, focus management, skip links |
| 10 | SEO | Metadata, OG images, sitemap, robots.txt, structured data (JSON-LD) |

## PM Rules

- **Start every session** by stating which milestone is active and what the next concrete task is.
- **After completing a task**, update the milestone status and suggest the next step — don't wait to be asked.
- **Flag blockers** immediately: missing API keys, unclear requirements, external dependencies not yet set up.
- **Scope discipline:** don't add features beyond what's listed here without checking with the user first.
- **Firebase for all content:** all dynamic content (speakers, schedule, sponsors, team, FAQ, CfS submissions) lives in Firestore. Use the Admin SDK server-side and the client SDK for any real-time needs.
- **Env vars:** never hardcode secrets. Use `.env.local` for local dev and Vercel environment variables for production. Always list required env vars when a new integration is added.

## Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `CFS_OPEN` | `true` to show CfS form, `false` to show closed message |
| `FIREBASE_PROJECT_ID` | Firebase project identifier |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client SDK |
| `RESEND_API_KEY` | Resend email sending |
| `RESEND_FROM_EMAIL` | Sender address for confirmation emails |

## Current Status

**Active milestone:** 2 — Static pages ✅ (complete)
**Next task:** Milestone 3 — CfS form UI, validation, and open/closed state
