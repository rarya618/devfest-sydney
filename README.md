# GDG Sydney back office

The server side of GDG Sydney, at [app.gdgsydney.com](https://app.gdgsydney.com): the organiser admin, the speaker portal, the endpoints behind the forms on [gdgsydney.com](https://gdgsydney.com), the signed-link pages in our emails, and a read-only public API.

It started as the DevFest Sydney 2026 website. Since the event, the public pages live on the static Astro site [gdgsydney.com](https://gdgsydney.com) (repo `gdg-sydney`), and this app keeps everything that needs a server. The repo and Firebase project keep the `devfest-sydney` name.

[`PM.md`](./PM.md) is the full reference: every route, the data model, the flows, environment variables and what's next. [`EVENT.md`](./EVENT.md) has the DevFest 2026 event details.

## Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4 (config lives in `globals.css` via `@theme`, no `tailwind.config.ts`)
- **Database:** Firestore, via Firebase Admin SDK (server) and Firebase client SDK (client)
- **Storage:** Firebase Storage, for images referenced from Firestore documents
- **Auth:** Firebase Auth with Google sign-in for organisers (emails in the `admins` collection); a single-use emailed link for speakers
- **Email:** Resend
- **Analytics:** Google Analytics 4
- **Hosting:** Firebase App Hosting, backend `devfest-sydney`, project `devfest-sydney-2026`. Pushing to `main` deploys.
- **Ticketing:** Humanitix (external, no in-house payments)

## What's here

| Area | Where | What it does |
|---|---|---|
| Landing | `/` | Choose speaker sign-in or organiser sign-in |
| Admin | `/admin` | DevFest proposals, speakers, volunteers and showcase; meetup talks; all speakers; the volunteer pool; events; analytics; admins |
| Speaker portal | `/speaker` | Speakers sign in with an emailed link to see their talks and proposals, edit their profile and propose new talks |
| Signed-link pages | `/speaker/confirm`, `/volunteer/confirm`, `/volunteer/join`, `/builder-showcase/confirm`, and others | Pages reached from links in our emails. Each acts behind a button, so mail scanners can't answer for someone |
| Form endpoints | `/api/submit-*` | Receive the forms on gdgsydney.com, across origins (CORS in `src/lib/gdgSiteOrigins.ts`) |
| Public API | `/api/public/*` | Read-only speakers, schedule, partners, labels and status, for gdgsydney.com builds. Never emails or internal ids |
| Privacy | `/privacy` | Privacy policy for the data this app holds, and the only page in the sitemap |

### Meetup talk proposals

The Speak page on gdgsydney.com posts to `/api/submit-meetup-proposal`, which validates the proposal, saves it to `meetupProposals` and emails the speaker a confirmation, bcc'd to hello@gdgsydney.com. Organisers review it at `/admin/meetups`.

It's also the one endpoint documented for AI agents, in [gdgsydney.com/llms.txt](https://gdgsydney.com/llms.txt), so an agent can propose a talk for the person it's working with. Because of that:

- **It's rate limited** (`src/lib/meetupProposalLimits.ts`): 3 proposals per email address a day and 20 site-wide an hour, answered with `429` and `Retry-After`. If you change the numbers, change them in `llms.txt` in the `gdg-sydney` repo too.
- **Agent proposals are labelled.** A request with no `Origin` header (from outside a browser) is filed with `source: 'api'`, and its card on `/admin/meetups` shows a "Sent by an agent" chip.
- **The honeypot still applies.** A filled-in `companyWebsite` field is accepted and silently dropped.

## Getting started

```bash
npm install
npm run dev
```

Requires a `.env.local` with the variables listed in [PM.md, Required Environment Variables](./PM.md#required-environment-variables). Local development reads production's Firestore, so be careful with writes. Forms stay closed locally unless you set `DEV_OPEN_FLOWS=true`.

Event settings (open or closed, deadlines, ticket links) aren't environment variables: they live on each event, edited at `/admin/events`.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run start`: run the production build
- `npm run lint`: lint the codebase

One-off data scripts (seeding, migrations, uploads) are in `scripts/`. Most explain themselves in a comment at the top; the Firestore ones are also described in PM.md.

## Contributing

Coding conventions, branding, and project rules live in [`CLAUDE.md`](./CLAUDE.md), [`BRANDING.md`](./BRANDING.md), and [`AGENTS.md`](./AGENTS.md).
