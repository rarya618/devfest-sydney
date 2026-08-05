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
- **Multiple submissions per person are allowed by design** (e.g. someone submitting a talk and a workshop). Do not add dedupe/rate-limiting on email for `submit-proposal` without checking with the user first.

### Volunteer Signup Flow
- `/volunteer` page with a signup form, open/closed state controlled by `VOLUNTEER_OPEN`
- Form fields: name, email, phone (optional), motivation, availability (full day / morning / afternoon), areas of interest (registration, AV/tech, speaker support, Builder's Space, general floater), prior volunteering experience (optional), dietary requirements (optional)
- On submit: confirmation email to the volunteer (via Resend), signup stored in Firestore (`volunteers` collection)
- Reviewed in `/admin/volunteers`: admins can accept, reject, restore, or archive a signup and add reviewer notes. No promotion to a separate public collection (unlike CfS → `speakers`) — volunteers aren't shown publicly.

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
| 7 | SEO | Metadata, OG images, sitemap, robots.txt, structured data (JSON-LD) |
| 8 | Speaker & schedule pages | Fetched from Firestore after CfS closes and speakers are accepted |
| 9 | Polish & launch | Responsive QA, performance, accessibility; Firebase App Check (reCAPTCHA Enterprise) to restrict Firestore access to approved apps only |
| 10 | Accessibility audit | Full WCAG AA compliance, keyboard navigation, screen reader support, focus management, skip links |

> Reprioritized 2026-07-25: SEO moved up ahead of speaker/schedule pages, polish, and accessibility, so the CfS gets better search/social discovery while it's still open. Speaker/schedule pages are on hold until closer to the CfS closing date. Within Milestone 7, prioritize `/call-for-speakers` (metadata, OG image, JSON-LD, sitemap inclusion) before extending SEO work to the rest of the site.

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
| `VOLUNTEER_OPEN` | `true` to show volunteer signup form, `false` to show closed message |
| `FIREBASE_PROJECT_ID` | Firebase project identifier |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client SDK |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client SDK |
| `RESEND_API_KEY` | Resend email sending |
| `RESEND_FROM_EMAIL` | Sender address for confirmation emails |
| `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` | Firebase App Check (reCAPTCHA Enterprise site key) |
| `NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN` | App Check debug token for local dev (`true` to auto-generate, or paste a registered UUID) |

## Current Status

**Active milestone:** 7 — SEO (complete for all current public pages)
**Verified:** `/`, `/call-for-speakers`, and `/code-of-conduct` each have correct `<title>`, canonical URL, and page-specific OpenGraph/Twitter metadata. `/call-for-speakers` has its own dynamic OG image (`opengraph-image.tsx`, on-brand GDG dots + wordmark, generated via `next/og`, no stored asset); `/` and `/code-of-conduct` share the site-wide default (`src/app/opengraph-image.tsx` — note: file-convention OG images do NOT cascade to child routes, so `/code-of-conduct` references it explicitly via `openGraph.images`/`twitter.images`). `sitemap.xml` and `robots.txt` (disallows `/admin`, `/api`) added. Minimal `Organization` JSON-LD added to the root layout. Confirmed via curl (200s, correct tags, valid sitemap/robots output) and visually inspected both OG images.
**Deliberately deferred:** `Event` JSON-LD schema — needs a confirmed `startDate`, and the event date is still TBC per `EVENT.md`. Add once the date is locked in.
**Next task:** Milestone 8 — Speaker & schedule pages (deferred until closer to the CfS closing date), or Milestone 9 — Polish & launch in the meantime.
