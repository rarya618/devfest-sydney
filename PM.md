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
- `/` : landing page choosing speaker sign-in (`/speaker`) or organiser sign-in (`/admin`). No longer redirected to `/admin` (changed 2026-11-14)
- `/privacy` : privacy policy, the only page in the sitemap. Covers the data this app holds
- `/speaker/confirm` : an accepted speaker (DevFest or meetup) confirms from the signed link in their acceptance email
- `/speaker/thanks` : DevFest 2026 post-event form: postal address for a mug and/or a work email for the Asana Enterprise trial (with a consent tick)
- `/volunteer/confirm` : an accepted volunteer confirms; then shows the event's ticket and WhatsApp links
- `/volunteer/join` : a past volunteer answers an invite to a new event (prefilled details, asks only areas and a note)
- `/volunteer/unsubscribe` : "Don't invite me again" from a volunteer invite
- `/builder-showcase/confirm` : an accepted showcase entrant confirms; then shows the showcase ticket link
- `/feedback` : DevFest 2026 survey (pinned to `devfest-2026` by `FEEDBACK_EVENT_ID`)
- `/credits` : DevFest 2026 workshop credit requests (Shang Yi Lim's workshop only, `CREDIT_WORKSHOP_SLOT_IDS`)
- `/speaker` : the speaker portal (stage 6, below). `/speaker/sign-in` and `/speaker/sign-in/verify` are its sign-in; `/speaker` lists the address's profiles, talks and proposals; profiles are edited in place on `/speaker` (the header's profile button opens `/speaker?edit=<speakerId>`); proposing (a meetup, or DevFest while the current DevFest's CfS is open) opens in place too (`/speaker?propose` or `?propose=<savedTalkId>`); saved talks are added, edited and deleted in place on `/speaker`. Only sign-in has pages of its own

Every confirm-style page acts behind a button, never on page load, so mail scanners can't answer on someone's behalf. (The portal's sign-in link is the exception: it signs in as the page opens, see stage 6.) Each sends hello@gdgsydney.com a notice with `replyTo` set to the person, once, on the transition only.

### Admin (`/admin`, Google sign-in, emails in the `admins` collection)
Sidebar groups:
- **DevFest**, every page under `/admin/devfest/` (moved 2026-11-14; the old paths 308 there from `next.config.ts`, and `/admin` itself redirects to talk proposals). The heading doubles as an edition picker once there are two DevFests (`admin-devfest` cookie, defaults to the current DevFest, `src/lib/adminEvent.ts`)
  - **Forms:** Talk proposals (`/admin/devfest/proposals`), Volunteers, Showcase, Feedback, Credits (not edition-filtered: 2026 only), Speaker gifts
  - Speakers (`/admin/devfest/speakers`), Crew (`/admin/devfest/crew`), Analytics
- **GDG Sydney:** All speakers (`/admin/people`; Preview shows a speaker's public card exactly as the portal shows it to them, `src/components/SpeakerCard.tsx`; Edit profile here and on DevFest > Speakers shows the same card live as you type), Volunteer pool (`/admin/volunteer-pool`), Analytics (`/admin/analytics`: every event side by side, speakers, meetup proposals and volunteers across events, from `src/lib/gdgAnalytics.ts`; DevFest > Analytics stays one DevFest's forms)
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
- **Abstracts are a small Markdown subset** (2026-11-14): bullet and numbered lists, `**bold**`, `*emphasis*`, `` `code` `` and `[links](https://…)`, rendered by `src/components/MarkdownText.tsx` (React elements only, no HTML, http(s) links only) wherever the admin shows one. Stored and returned by the public API as typed, so a consumer such as gdgsydney.com renders it or shows it plain.
- **`talks/{talkId}`:** `eventId`, title, abstract, format, track, level, `speakerIds` (lead first), `submissionId` or `meetupProposalId`. The talk id is the proposal id. `speakerState.<speakerId>` holds per-presenter sends (co-speaker ticket, calendar invite and its `calendarInviteUid` / sequence, thank-you)
- **`submissions`** (DevFest talk proposals) and **`meetupProposals`** (from `/speak`; gains `eventId` only when accepted into an event): the record of the decision: status, reviewer notes, acceptance email sent, `confirmByDate`, `speakerConfirmedAt`, the lead's ticket send. **Multiple proposals per person are allowed by design**: don't add email dedupe without asking
- **`volunteerProfiles/{profileId}`:** a GDG-wide volunteer (contact, experience, Torrens and GDG on Campus answers, dietary needs, photo, LinkedIn, `inPool` / `inPoolAt` / `inPoolBy`, `isOrganiser` / `organiserRole` / `organiserSince` for a GDG-wide organiser (set by Add organiser, or by hand for someone who joined the team between events, as Esra Rizvi did after DevFest 2026), `volunteerInvites.<eventId>`, `inviteOptOut`). Reused when email AND name match (`src/lib/volunteerProfiles.ts`)
- **`volunteers`:** one signup per person per event, holding no person fields (cleared by `scripts/cleanup-volunteer-fields.mjs`): `eventId`, `profileId`, motivation, areas, status, notes, roster (`assignedArea`, `assignedShift`), `showOnCrewPage`, acceptance and confirmation, ticket mark. Organisers are `isOrganiser: true` with `organiserRole`; they have no signup behind them, so Remove deletes them
- **`showcase`:** Builder Showcase entries (no client writes at all)
- **`schedule`:** slots with `eventId`, `kind` (session / break / plenary), `title`, `talkIds`, `startTime`, `durationMinutes`, `room`, `isTentative`. Loaded by `scripts/seed-schedule.mjs` (`EVENT_ID`, `--dry-run`); 2026 slot ids have no event prefix, later events' do
- **`sponsors`**, **`partners`** (community partners, empty), **`admins`**
- **`savedTalks`:** talks a portal user keeps to propose later: `ownerEmail`, title, abstract, audience. Private to the address until proposed; a proposal made from one records `savedTalkId` and is a copy
- **`portalSignInLinks`, `portalSignInRequests`, `portalSessions`:** the speaker portal's sign-in (`src/lib/portalAuth.ts`). Ids are SHA-256 hashes (of the link token, the email, the cookie), so the collections hold nothing that signs anyone in. Each has `expiresAt`; used links and signed-out sessions are deleted, expired ones linger until a TTL policy is set (see Next tasks)
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
- **Talks agreed outside the form** (invited speakers): `scripts/add-agreed-meetup-talks.mjs <talks.json> [--dry-run]` files each as a meetup proposal (`source: organiser`), accepted into a general event and confirmed, with no email, doing what Accept does. The JSON holds emails, so it stays out of the repo. A proposal confirmed this way shows as Confirmed in the portal and the admin
- `/admin/devfest/speakers` rows are (talk, speaker) pairs; profile edits go to the person, talk edits only from the lead's row. Photos upload to `speaker-photos/<id>/` (5 MB JPEG/PNG/WebP; `serverActions.bodySizeLimit` is 6 MB for this)

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
| 4f | Meetup talks accepted into general events | Done. First general event: `devfest-extended-android-for-the-agentic-era` (1 Dec 2026), with three talks added by script on 2026-11-14 (Jonathon Reid, Katie Barnett, Kartik Arora). Accept from `/admin/meetups` not yet exercised |
| 4g | Starter guides into Firestore | **Not started** |
| 5 | Meetups through the pipeline | Intake, review, acceptance and confirmation done (via 4f). Rejection emails, tickets, invites and thank-yous for meetups not done |
| 6 | Speaker portal | Built 2026-11-14, checked in production the same day (see below). Not yet linked from anywhere |

### Remaining stage 4 work
- **4c and 4d cleanup passes (written 2026-11-13):** `scripts/cleanup-speaker-fields.mjs` removes the talk fields, `submissionId`, `promotedAt`, `eventId`, `coSpeakerOf` and the per-speaker sends from all 23 `speakers` documents, and `speakerIds` from all 28 slots. `scripts/cleanup-volunteer-fields.mjs` removes the person fields from all 52 signups; it refuses if a signup has no profile or holds a value its profile lacks (placeholders like "N/A" don't count). Both dry runs pass against production. The code no longer falls back to a signup's own copy: `loadVolunteerRecord` returns null without a profile, and the crew editor writes only to the profile. `firestore.rules` drops the `speakers` and `schedule` blocks (until now `speakers`, emails included, was **publicly readable**) and the public create on `volunteers`. Old code works with the cleaned data and new code with the old data, so the scripts, the push and the rules deploy (`firebase deploy --only firestore:rules`) can happen in any order.
- **Known limit:** the public projection is one entry per talk, so a person with two talks at one event gets a second slug (`-2`).
- **Known data quirk, left as is (decided 2026-11-14):** Yuting Mao is stored under Qasim Tariq's email, so signing in to the portal with that address shows and can edit both profiles.
- **4g:** `starterGuides` collection (today `gdg-sydney/src/data/starterGuides.ts`, 33 guides, logos already in Storage under `guide-logos/`), an editor under the admin, `/api/public/starter-guides`, and the stage 1 rebuild trigger (a `repository_dispatch` on `gdg-sydney`) firing on save. Build the trigger once here and reuse it for speakers, schedule and sponsors.

### Stage 6: speaker portal
At `/speaker`, its own area outside `/admin`. Decided 2026-11-14:
- **Sign-in is our own single-use magic link**, not Firebase Auth and not Google: a 30-minute link sent through Resend, used by `/speaker/sign-in/verify` from the browser as soon as it opens (decided 2026-11-14, replacing a button; the server render only looks it up, so scanners that merely fetch the URL can't burn it, though ones that run JavaScript, like Microsoft's, can, and the speaker then asks for a new link), landing on the dashboard. The session is a random token in an httpOnly `portal_session` cookie scoped to `/speaker`, 30 days, revocable by deleting its `portalSessions` document. It never touches the admin's `__session`. This drops the custom Auth domain the plan used to need first. Rate limit: one link a minute and five an hour per address.
- **A session is an email address, not a person.** The portal shows every `speakers` person with that `emailNormalised` (several, for a shared address) and every proposal in `submissions` / `meetupProposals` with that `email`. Any address can sign in, so a first-time speaker can propose; the sign-in form says the same thing whether or not we know the address.
- **Profile edits go live at once** (tagline, bio, links, photo; not name or email, which stay with organisers since a rename moves the public slug). Organisers are not emailed about edits (decided 2026-11-14); they see the current profile in `/admin/people`.
- **Proposing** goes through the same validation, storage and confirmation email as the form endpoints (`src/lib/proposalFiling.ts`, shared with `/api/submit-proposal` and `/api/submit-meetup-proposal`). The email is always the session's. DevFest ones carry `tracking.ref = speaker-portal`, meetup ones `source = speaker-portal`.
- **Saved talks** (added 2026-11-14 on request): a speaker can keep a talk without sending it, from "Add a talk" or "Save for later" on the proposal form, and propose it when ready. It stays after proposing, so one talk can go to a meetup and later to DevFest, and the dashboard lists where each has gone. Up to 50 per address.
- **Status shows only what the speaker has been told:** a decision reads "Under review" until its acceptance or rejection email has gone (or, for a talk agreed outside the form, until it is recorded as confirmed). An accepted, unconfirmed proposal links to its `/speaker/confirm`. The talk lists (Upcoming, Past) follow the same rule: a talk shows only once its proposal, the lead's for a co-speaker, has been announced.
- **Editing a proposal** (added 2026-11-14 on request): Edit on a proposal in the dashboard reopens the proposal form, prefilled, in the panel. Allowed while the proposal is `pending`, DevFest ones included after the CfS closes; locked once an organiser accepts or rejects, even before the email (the check and the write share a transaction, `editOwnProposal` in `src/lib/proposalFiling.ts`). Everything but name, email and where it came from can change, through the same validators as filing. No email goes out; `editedAt` is stamped and the admin cards show "Edited <date>".
- **Editing an accepted meetup talk** (added 2026-11-14): speakers can keep editing a meetup proposal after acceptance, once they have been told, until the event ends ("Edit your talk"), except its format, which is the organisers' once the talk is on a meetup's programme; organisers can edit any meetup proposal at any time from Edit in the card's More menu on `/admin/meetups`. Both go through `editMeetupProposal`, which writes the proposal and its talk together, so the portal and the public API agree. Only speaker edits mark it "Edited". Name and email are edited on the person (`/admin/people`).
- **Editing an accepted DevFest talk** (added 2026-11-14): the same rule (once told, until the event ends), but only the title and abstract, since organisers own track, format and level (Spotlight and Keynote are talk-only tracks). The form starts from the talk; saving writes the talk and the submission and marks it "Edited" (`editAcceptedDevfestTalk`). The two admin editors keep them in step too: a lead's talk edit on `/admin/devfest/speakers` copies the title and abstract to the submission, and an accepted submission edited on the proposals page copies a changed title or abstract to the talk.
- Not built: withdrawing a proposal, co-speakers seeing a proposal filed under the lead's address.
- **Linked from gdgsydney.com/speak** (`gdg-sydney`, 2026-11-14): a line under the form heading for returning speakers, and one in the message after submitting.
- **Linked from the speaker emails** (2026-11-14): the proposal confirmations (DevFest and meetup), the acceptance email ("Your speaker profile") and the thank-you email ("Your next talk") carry an "Open the speaker portal" button to `/speaker/sign-in` (`portalSignInUrl()` in `src/lib/portalAuth.ts`), never a sign-in link, since those expire in 30 minutes.

### Open decisions
- **States that flip by date** (tickets on sale, form deadlines) can't be frozen into a static page: a browser island asking `/api/public/status`, or a scheduled rebuild at each deadline. Pick per state, when the next live edition starts.
- **Meetup proposals that don't fit the next meetup:** stay pending for a later one, or decline with an invitation to resubmit (decides whether a "held" status is needed).
- **Who can create events:** any admin, or only some. There are no roles today.
- **Who maintains it:** two frameworks to keep up. Write it down if other organisers join, and explain the project ID in the README.

## Next tasks (as of 2026-11-14)

0. **Speaker portal: done and linked.** Checked in production 2026-11-14 with an organiser address: the sign-in link, the `portal_session` cookie surviving a fresh load behind the CDN, a profile edit reaching Firestore, and a meetup proposal filed with `source = speaker-portal` (then deleted). Optionally add TTL policies on `expiresAt` for the three portal collections (`gcloud firestore fields ttls update expiresAt --collection-group=portalSessions --enable-ttl --project devfest-sydney-2026`, and the same for `portalSignInLinks` and `portalSignInRequests`). It is linked from the speaker emails and gdgsydney.com/speak.

1. **Stage 0, the 2026 clean-up.** Each item waits on something outside the app:
   - **Job board data** (`jobSeekers` 34, `jobListings` 6, still in Firestore): share the two CSVs in `~/Desktop/devfest-2026/` with employers, then delete both collections and the Desktop copies. The open-to-work CSV deliberately has no emails and only the 29 approved profiles, which is what the consent tick covered.
   - **`speakerGifts`:** once the mugs have shipped and the Asana list has gone to Asana, "Delete all" on `/admin/devfest/speaker-gifts`.
   - **`creditRequests`:** once workshop credits are sent, delete on `/admin/devfest/credits`.
   - Then reword the matching `/privacy` sections (Job Board still says "We take the job board down ... after the event") to say the data has been deleted.
2. **Security leftovers:** rotate the reCAPTCHA key's secret (it once sat in `.env.local` under the site key's name), and decide whether to switch App Check on in production.
3. **Verify before relying on them** (never exercised with a real send, since every recipient was real): a volunteer invite and `/volunteer/join` submission, and the meetup acceptance flow. Use the Android event (or a test general event), and send one of each to an organiser inbox.
4. If not yet done: run the two cleanup scripts and deploy the rules (see Remaining stage 4 work). Then 4g.
