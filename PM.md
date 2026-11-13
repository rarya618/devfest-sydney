# GDG Sydney back office: Project Manager

You are the project manager and lead developer for this app. Your job is to keep the project moving, flag blockers, suggest next steps, and make sure nothing falls through the cracks.

This file describes the app as it is now and what is left to do. The history of how it got here (DevFest 2026's public site, its launch, and every past fix) is in git: `git log -- PM.md` shows this file as it was before the 2026-11-13 clean-up.

## Project Overview

**What it is:** GDG Sydney's back office, at `app.gdgsydney.com`. It started as the DevFest Sydney 2026 website; since the event (10 October 2026, see [`EVENT.md`](./EVENT.md)) its public content pages live on the static Astro site `gdgsydney.com` (repo `gdg-sydney`), and this app keeps everything that needs a server: the admin, the form endpoints, the signed-link pages, and a read-only public API.
**Covers:** DevFest editions and GDG Sydney's general events (meetups, workshops). Bevy (`gdg.community.dev`) stays the source of truth for event listings, RSVPs, team and sponsors on the main site.
**Stack:** Next.js (App Router) + Tailwind CSS v4 + Firebase (Firestore, Auth, Storage) + Resend (email)
**Hosting:** Firebase App Hosting, backend `devfest-sydney`, project `devfest-sydney-2026` (display name "GDG Sydney"; the ID can't change and moving projects isn't worth it, decided 2026-11-10). Pushing to `main` deploys.

## Scope

### Public pages (all `noindex` except `/privacy`, reached by link only)
- `/` : redirects to `/admin`
- `/privacy` : privacy policy, the only page in the sitemap. Covers the data this app holds
- `/speaker/confirm` : an accepted speaker (DevFest or meetup) confirms from the signed link in their acceptance email
- `/speaker/thanks` : DevFest 2026 post-event form: postal address for a mug and/or a work email for the Asana Enterprise trial (with a consent tick)
- `/volunteer/confirm` : an accepted volunteer confirms; then shows the event's ticket and WhatsApp links
- `/volunteer/join` : a past volunteer answers an invite to a new event (prefilled details, asks only areas and a note)
- `/volunteer/unsubscribe` : "Don't invite me again" from a volunteer invite
- `/builder-showcase/confirm` : an accepted showcase entrant confirms; then shows the showcase ticket link
- `/feedback` : DevFest 2026 survey (pinned to `devfest-2026` by `FEEDBACK_EVENT_ID`)
- `/credits` : DevFest 2026 workshop credit requests (Shang Yi Lim's workshop only, `CREDIT_WORKSHOP_SLOT_IDS`)

Every confirm-style page acts behind a button, never on page load, so mail scanners can't answer on someone's behalf. Each sends hello@gdgsydney.com a notice with `replyTo` set to the person, once, on the transition only.

### Admin (`/admin`, Google sign-in, emails in the `admins` collection)
Sidebar groups:
- **DevFest** (heading doubles as an edition picker once there are two DevFests; `admin-devfest` cookie, defaults to the current DevFest, `src/lib/adminEvent.ts`)
  - **Forms:** Talk proposals (`/admin`), Volunteers, Showcase, Feedback, Credits (not edition-filtered: 2026 only), Speaker gifts
  - Speakers (`/admin/speakers`), Crew (`/admin/crew`), Analytics
- **GDG Sydney:** All speakers (`/admin/people`), Volunteer pool (`/admin/volunteer-pool`)
- **General events:** Meetup talks (`/admin/meetups`), Volunteers (`/admin/event-volunteers?event=<id>`)
- **Tools:** Links (UTM tracking links)
- **Settings:** Events (`/admin/events`), Admins

### API
- **Form endpoints** (used by forms on gdgsydney.com, posting across origins; CORS from `src/lib/gdgSiteOrigins.ts`): `/api/submit-proposal`, `/api/submit-volunteer`, `/api/submit-showcase` (each open only while the current DevFest has that flow open, 503 if the event can't be read), `/api/submit-meetup-proposal` (from `gdgsydney.com/speak`), `/api/submit-feedback`, `/api/submit-credit-request`, `/api/submit-speaker-gift`
- **Public API** (`/api/public/*`, read-only, `Cache-Control: no-store`, 503 rather than an empty list on a failed read so an Astro build keeps its old pages): `speakers`, `schedule` (current DevFest, 404 if none), `events/<id>/speakers`, `events/<id>/schedule`, `partners`, `labels` (track/format/level/room/tier labels and hex colours), `status` (`?event=`, default current DevFest). Projections only, never emails or internal ids
- `/api/admin/session` : session cookie exchange for the admin

### Redirects (`src/lib/siteRedirects.ts`, spread into `next.config.ts`)
- `devfest.gdgsydney.com` content paths 308 to the 2026 archive on gdgsydney.com (`/devfest/2026`, speaker pages one for one, plus `saheb-yuvraj-singh` to `qasim-tariq`); `/guides`, `/builders-space*` and `/crew` to their gdgsydney.com ports
- Every other path on the old host 308s to `APP_ORIGIN`, query string kept, so emailed tokens keep working. `/api/*` and `/_next/*` are never redirected (a CORS preflight can't follow a redirect)
- Rules are emitted on both `x-forwarded-host` and `host`: behind App Hosting's CDN, Next sees the backend's own address in `Host`

## Data model

Every collection is read and written through the Admin SDK; no client code uses Firestore. The rules allow public reads only of `sponsors`, `partners`, `team` and `faq`, and a public create only on `submissions` (unused since the CfS form moved to `/api/submit-proposal`). No composite indexes: lists are `where('eventId', '==', ...)` and sorted in memory (`src/lib/eventScope.ts`); add indexes if a collection grows past a few thousand documents.

- **`events/{eventId}`** (readable ids: `devfest-2026`, `meetup-2026-12`): `type` (`devfest` | `general`), name, `startAt`, `endAt`, `timeZone`, venue, `bevyUrl`, `humanitixUrl`, `ticketLowestPrice`, `ticketsOnSaleAt`, and `cfs` / `showcase` / `volunteers` blocks of `{ enabled, open, closesAt }`. Tickets close automatically when the event ends. Helpers in `src/lib/events.ts`; wall-time conversion in `src/lib/zonedTime.ts`
- **`eventPrivate/{eventId}`:** the links that unlock something (speaker, showcase and volunteer ticket access-code URLs, volunteer WhatsApp invite). Write-only in the admin form. Separate document so a public projection can't leak them
- **`settings/site`:** `currentDevfestEventId` (which DevFest the form endpoints and `/api/public/status` follow), `speakerPhotosUrl` (the 2026 thank-you photos folder), partner logos and the prospectus URL
- **`speakers/{speakerId}`:** a GDG-wide person (name, email, `emailNormalised`, tagline, bio, photo, links, `previousSlugs`). Reused on promotion only when email AND name match (`findOrCreatePerson`, `src/lib/people.ts`): 2026 has two people on one address. Holds nothing about any talk (cleared by `scripts/cleanup-speaker-fields.mjs`)
- **`talks/{talkId}`:** `eventId`, title, abstract, format, track, level, `speakerIds` (lead first), `submissionId` or `meetupProposalId`. The talk id is the proposal id. `speakerState.<speakerId>` holds per-presenter sends (co-speaker ticket, calendar invite and its `calendarInviteUid` / sequence, thank-you)
- **`submissions`** (DevFest talk proposals) and **`meetupProposals`** (from `/speak`; gains `eventId` only when accepted into an event): the record of the decision: status, reviewer notes, acceptance email sent, `confirmByDate`, `speakerConfirmedAt`, the lead's ticket send. **Multiple proposals per person are allowed by design**: don't add email dedupe without asking
- **`volunteerProfiles/{profileId}`:** a GDG-wide volunteer (contact, experience, Torrens and GDG on Campus answers, dietary needs, photo, LinkedIn, `inPool` / `inPoolAt` / `inPoolBy`, `isOrganiser` / `organiserRole` / `organiserSince` for a GDG-wide organiser (set by Add organiser, or by hand for someone who joined the team between events, as Esra Rizvi did after DevFest 2026), `volunteerInvites.<eventId>`, `inviteOptOut`). Reused when email AND name match (`src/lib/volunteerProfiles.ts`)
- **`volunteers`:** one signup per person per event, holding no person fields (cleared by `scripts/cleanup-volunteer-fields.mjs`): `eventId`, `profileId`, motivation, areas, status, notes, roster (`assignedArea`, `assignedShift`), `showOnCrewPage`, acceptance and confirmation, ticket mark. Organisers are `isOrganiser: true` with `organiserRole`; they have no signup behind them, so Remove deletes them
- **`showcase`:** Builder Showcase entries (no client writes at all)
- **`schedule`:** slots with `eventId`, `kind` (session / break / plenary), `title`, `talkIds`, `startTime`, `durationMinutes`, `room`, `isTentative`. Loaded by `scripts/seed-schedule.mjs` (`EVENT_ID`, `--dry-run`); 2026 slot ids have no event prefix, later events' do
- **`sponsors`**, **`partners`** (community partners, empty), **`admins`**
- **Pinned to DevFest 2026, due for deletion** (see Next tasks): `speakerGifts`, `creditRequests`, `jobSeekers`, `jobListings`
- `feedback`: survey answers, `eventId` on each

### Signed links
HMACs of document ids, all in `src/lib`. **Never re-key a document**: links already in inboxes would break.
| Link | Signs | Secret / prefix |
|---|---|---|
| `/speaker/confirm` | proposal id (submission or meetup proposal, unique across both) | `SPEAKER_CONFIRM_SECRET` |
| `/speaker/thanks` | speaker id | `SPEAKER_CONFIRM_SECRET`, `speaker-thanks:` |
| `/volunteer/confirm` | volunteer signup id | `VOLUNTEER_CONFIRM_SECRET` |
| `/volunteer/join` | profile + event | `VOLUNTEER_CONFIRM_SECRET`, `volunteer-invite:` |
| `/volunteer/unsubscribe` | profile | `VOLUNTEER_CONFIRM_SECRET`, `volunteer-opt-out:` |
| `/builder-showcase/confirm` | entry id | `SHOWCASE_CONFIRM_SECRET` |

Production's signing secrets are NOT the `.env.local` values, so a link minted locally won't validate in production. Rotating one invalidates every link already sent.

## Flows

All sends are explicit admin actions, never side effects of a status change. Each records `...SentAt` / `...SentBy` and a reviewer note, and surfaces a send failure to the admin. Bulk sends go one at a time 600ms apart (Resend's rate limit). Email copy reads the record's own event (`src/lib/eventCopy.ts`); DevFest emails carry the DevFest wordmark, everything else the GDG Sydney logo (`emailLogoTag`).

### Speakers
- **DevFest:** proposal in `submissions` → accept → promote (creates or reuses the person, creates the talk) → acceptance email (6-day `confirmByDate`) → `/speaker/confirm` → ticket email (confirmed only, enforced server-side) → calendar invite once on the schedule (`text/calendar; method=REQUEST`, UTC, one UID per presenter per talk, rising SEQUENCE; update and cancellation from the card) → thank-you email after the event
- **Rejection:** never automatic. Sent per person, not per proposal, within one event (`src/lib/rejectionEligibility.ts`); refused for anyone speaking or with a proposal still pending. Invites them to a meetup instead
- **Co-speakers:** a second id in a talk's `speakerIds`. No acceptance email (the lead answered); they get their own ticket, invite and thank-you
- **Meetups:** `/speak` → `meetupProposals` → `/admin/meetups` Accept picks an upcoming general event and creates the talk → acceptance email → `/speaker/confirm`. Moving an accepted proposal back deletes the talk (and the person if they give no other talk)
- `/admin/speakers` rows are (talk, speaker) pairs; profile edits go to the person, talk edits only from the lead's row. Photos upload to `speaker-photos/<id>/` (5 MB JPEG/PNG/WebP; `serverActions.bodySizeLimit` is 6 MB for this)

### Volunteers
- Public form → `volunteers` (creates or reuses the profile) → accept → acceptance email (2-day `confirmByDate`) → `/volunteer/confirm` → ticket and WhatsApp links from the signup's event
- Roster on DevFest > Crew: area, shift, photo (`crew-photos/<id>/`), ticket-sent mark (manual, sends nothing), CSV export, Add organiser
- **Inviting back:** only to the **volunteer pool**, an opt-in mailing list: `inPool` on the profile, set by an admin ("Add to pool" under Everyone else on `/admin/volunteer-pool`) for volunteers who said they'd like to hear about future events. Nobody is in it by default. Invite from the pool page for any event with volunteers enabled that hasn't ended, or with "Invite past volunteers" on Crew, which lists pool members who crewed an earlier event. Organisers (an organiser signup at any event, or `isOrganiser` on the profile) are never in it; they're added with Add organiser. Each invite links to `/volunteer/join` and carries a "Don't invite me again" link, which takes them out of the pool. A reply files a pending signup (`tracking.ref` = `volunteer-invite`)
- Public listing needs `showOnCrewPage` (admin-ticked, off by default) plus confirmation. A consent question belongs on the gdgsydney.com form when it's built

### Builder Showcase (DevFest only)
Entry → accept → acceptance email (2-day window, to the entrant, who passes it on to co-presenters) → `/builder-showcase/confirm` → showcase ticket link on the page, or the ticket email from the admin.

### Ticketing
Humanitix only; no payment code. Prices and tiers are not restated anywhere except `ticketLowestPrice` on the event. Ticket CTAs on gdgsydney.com carry UTM params in the visible URL.

## Milestones (DevFest 2026 build)

| # | Milestone | Status |
|---|-----------|--------|
| 1 to 8 | Scaffold, static pages, Firebase, CfS form and backend, admin, SEO, speaker and schedule pages | Done. The public pages have since moved to gdgsydney.com |
| 9 | Polish and launch, incl. Firebase App Check (reCAPTCHA Enterprise) | Launched, but **App Check has never run in production**: no reCAPTCHA site key is set there (site key `6Le24BgtAAAAAJ1QVOafS-AGT4QDQiwCbhgQKi9g`) |
| 10 | Accessibility audit | Done for the 2026 public site; the admin had a contrast pass |

The active work is the Post-2026 Plan below.

## PM Rules

- **Start every session** by stating the active work and the next concrete task.
- **After completing a task**, update this file and suggest the next step without being asked. Record what is true now; don't append a changelog (git keeps the history).
- **Flag blockers** immediately: missing API keys, unclear requirements, external dependencies not yet set up.
- **Scope discipline:** don't add features beyond what's listed here without checking with the user first.
- **Firebase for all content:** dynamic content lives in Firestore. Admin SDK server-side; client SDK only where a client component needs it.
- **Env vars:** never hardcode secrets. `.env.local` locally, `apphosting.yaml` plus Secret Manager in production. List required env vars whenever a new integration is added.

## Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Admin SDK service account |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | Client SDK |
| `SPEAKER_CONFIRM_SECRET` | Signs speaker confirm and thank-you links |
| `VOLUNTEER_CONFIRM_SECRET` | Signs volunteer confirm, invite and opt-out links |
| `SHOWCASE_CONFIRM_SECRET` | Signs showcase confirm links |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Email (from hello@gdgsydney.com) |
| `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` | App Check site key (unset in production) |
| `NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN` | App Check debug token for local dev |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 |
| `APP_ORIGIN` | `https://app.gdgsydney.com`. Turns on the old-host redirect. Needs BUILD availability (redirects are fixed at build) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and email links. `https://app.gdgsydney.com` in production |
| `GDG_SITE_ORIGINS` | Optional, comma-separated CORS origins. Default: gdgsydney.com, www, and `http://localhost:4321` |
| `DEV_OPEN_FLOWS` | `next dev` only: `true` opens every flow the current DevFest has enabled, since local dev reads production's Firestore. Ignored in production |

Event settings (open/closed, deadlines, ticket links) are not env vars: they live on `events` and `eventPrivate`, edited in `/admin/events`.

## Operational notes

- **Adding a secret to `apphosting.yaml` does not create it.** The rollout fails with "Misconfigured secret ... versions/latest" (it happened three times). Create it with `firebase apphosting:secrets:set NAME --project devfest-sydney-2026 --data-file - --force`, grant it with `firebase apphosting:secrets:grantaccess NAME --backend devfest-sydney`, then redeploy the same commit: `firebase apphosting:rollouts:create devfest-sydney --git-branch main --project devfest-sydney-2026`.
- **App Hosting rejects empty env values:** to unset one, omit it.
- **The calendar invite UID domain is a literal** (`devfest.gdgsydney.com` for 2026 invites, in `calendarInviteEmail.ts`), not the site URL. Changing it orphans every invite already sent.
- **Admin sessions** are checked without the revocation round trip (`src/lib/adminSession.ts`, cached per request); the `admins` lookup is what locks a removed admin out. Session cookies are per host.
- **Migrations** are scripts in `scripts/` with `--dry-run`, read before running against production. Additive first; removing old fields is a separate later pass.
- **Local dev:** `next dev` and `npm run build` share `.next`, and stray `next dev` processes have repeatedly collided (missing CSS, 404s). Check `pgrep -fl next`; build in a scratch copy. `npm run lint` is `eslint .`.
- **Dependencies:** on Next 15.5. A moderate Next advisory and the bundled PostCSS ones are fixed only in Next 16 (PostCSS ones need attacker-controlled CSS, which we never take).

## Post-2026 Plan: One GDG Sydney Site (agreed 2026-11-02)

**Goal:** use what was built for DevFest across the whole year. DevFest becomes a section of gdgsydney.com, and this app becomes the back office for DevFest and every GDG Sydney event. "All of GDG" stops at what Bevy already does: this app owns speakers across events, proposals, volunteers, feedback and event-day tooling.

**The split:** content that can be built ahead of time lives on `gdg-sydney` (Astro, static, Firebase Hosting); anything needing a server lives here. Ruled out: DevFest into Astro wholesale (needs a server), and `gdg-sydney` into Next (Astro is preferred for the content site). `gdg-calendar` and `gdg-syd-check-in` stay separate Firebase projects and read this app through the public API if they ever need its data.

**Decided:** separate speaker and volunteer profiles rather than one `people` collection (revisit if volunteers ever sign in); meetups use the same speaker and volunteer management as DevFest; two event types only, `devfest` and `general`; recommend both a public volunteer form per event and invites for past volunteers (built).

### Stages

| # | Stage | Status |
|---|---|---|
| 0 | 2026 clean-up promised on `/privacy` | **Open**, waiting on outside steps (see Next tasks) |
| 1 | Public API + rebuild trigger on admin saves | API done. Trigger deferred to the next live edition (built in 4g) |
| 2 | DevFest pages in Astro | Done 2026-11-05 as a frozen snapshot (`gdg-sydney` `src/data/devfest-2026.json`), not from the API |
| 3 | Domains and redirects | Done 2026-11-10. Builder's Space, guides and crew ported to gdgsydney.com; content pages deleted here 2026-11-13 |
| 4a | `events` collection, settings out of env vars | Done and migrated |
| 4b | `eventId` on everything event-shaped; DevFest edition picker | Done and migrated |
| 4c | Speakers split into people and talks | Done and migrated. Cleanup pass written 2026-11-13 (see below) |
| 4d | Volunteer profiles, invites, volunteer pool, general-event volunteers | Done and migrated (49 profiles, 52 signups). Cleanup pass written 2026-11-13 (see below) |
| 4e | Copy reads from the event | Done |
| 4f | Meetup talks accepted into general events | Done. Not exercised end to end: no general event exists yet |
| 4g | Starter guides into Firestore | **Not started** |
| 5 | Meetups through the pipeline | Intake, review, acceptance and confirmation done (via 4f). Rejection emails, tickets, invites and thank-yous for meetups not done |
| 6 | Speaker portal | **Not started**, needs nothing more from stage 4 |

### Remaining stage 4 work
- **4c and 4d cleanup passes (written 2026-11-13):** `scripts/cleanup-speaker-fields.mjs` removes the talk fields, `submissionId`, `promotedAt`, `eventId`, `coSpeakerOf` and the per-speaker sends from all 23 `speakers` documents, and `speakerIds` from all 28 slots. `scripts/cleanup-volunteer-fields.mjs` removes the person fields from all 52 signups; it refuses if a signup has no profile or holds a value its profile lacks (placeholders like "N/A" don't count). Both dry runs pass against production. The code no longer falls back to a signup's own copy: `loadVolunteerRecord` returns null without a profile, and the crew editor writes only to the profile. `firestore.rules` drops the `speakers` and `schedule` blocks (until now `speakers`, emails included, was **publicly readable**) and the public create on `volunteers`. Old code works with the cleaned data and new code with the old data, so the scripts, the push and the rules deploy (`firebase deploy --only firestore:rules`) can happen in any order.
- **Known limit:** the public projection is one entry per talk, so a person with two talks at one event gets a second slug (`-2`).
- **Data fix:** Yuting Mao is stored under Qasim Tariq's email; correct it by hand.
- **4g:** `starterGuides` collection (today `gdg-sydney/src/data/starterGuides.ts`, 33 guides, logos already in Storage under `guide-logos/`), an editor under the admin, `/api/public/starter-guides`, and the stage 1 rebuild trigger (a `repository_dispatch` on `gdg-sydney`) firing on save. Build the trigger once here and reuse it for speakers, schedule and sponsors.

### Stage 6: speaker portal
Speakers sign in to keep one profile, see past and upcoming talks, and propose to DevFest or a meetup. Its own area (`/speaker` or `/portal`), not inside `/admin`, so a missed role check can't expose other people's data. Magic links or Firebase email-link sign-in, not Google. Point Auth at a custom domain (e.g. `auth.gdgsydney.com`) first, since Google sign-in currently names `devfest-sydney-2026.firebaseapp.com`. If bios and photos by email become a pain sooner, a signed-link "edit your profile" page like `/speaker/thanks` covers it and folds in later.

### Open decisions
- **States that flip by date** (tickets on sale, form deadlines) can't be frozen into a static page: a browser island asking `/api/public/status`, or a scheduled rebuild at each deadline. Pick per state, when the next live edition starts.
- **Meetup proposals that don't fit the next meetup:** stay pending for a later one, or decline with an invitation to resubmit (decides whether a "held" status is needed).
- **Who can create events:** any admin, or only some. There are no roles today.
- **Who maintains it:** two frameworks to keep up. Write it down if other organisers join, and explain the project ID in the README.

## Next tasks (as of 2026-11-13)

1. **Stage 0, the 2026 clean-up.** Each item waits on something outside the app:
   - **Job board data** (`jobSeekers` 34, `jobListings` 6, still in Firestore): share the two CSVs in `~/Desktop/devfest-2026/` with employers, then delete both collections and the Desktop copies. The open-to-work CSV deliberately has no emails and only the 29 approved profiles, which is what the consent tick covered.
   - **`speakerGifts`:** once the mugs have shipped and the Asana list has gone to Asana, "Delete all" on `/admin/speaker-gifts`.
   - **`creditRequests`:** once workshop credits are sent, delete on `/admin/credits`.
   - Then reword the matching `/privacy` sections (Job Board still says "We take the job board down ... after the event") to say the data has been deleted.
2. **Security leftovers:** rotate the reCAPTCHA key's secret (it once sat in `.env.local` under the site key's name), and decide whether to switch App Check on in production.
3. **Verify before relying on them** (never exercised with a real send, since every recipient was real): a volunteer invite and `/volunteer/join` submission, and the meetup acceptance flow. Create the first general event in `/admin/events`, then send one of each to an organiser inbox.
4. If not yet done: run the two cleanup scripts and deploy the rules (see Remaining stage 4 work). Then 4g.
5. Optional: point the `/speak` form's `PROPOSAL_URL` in `gdg-sydney` at `app.gdgsydney.com` (the old host still works).
