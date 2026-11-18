# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Speakers at GDG Sydney events** (DevFest and the monthly meetups), using the speaker portal at `app.gdgsydney.com/speaker`. Mostly returning community speakers who visit a few times a year: to check where a proposal is up to, confirm a spot after an acceptance email, or update their bio and photo. First-time speakers arrive from gdgsydney.com/speak or the proposal confirmation email to propose a talk and follow it.
- **GDG Sydney organisers** (a small volunteer team), using the admin at `/admin` to review proposals, accept speakers and volunteers, and send every email by hand.
- **People answering an email**: accepted speakers, volunteers and showcase entrants, who open a signed link, answer one question, and leave.

## Product Purpose

GDG Sydney's back office. It holds everything about the community's events that needs a server: speakers and their talks across events, talk proposals, volunteers, feedback, and the pages people reach from emails. Content pages live on the static site gdgsydney.com, and Bevy stays the source of truth for event listings and RSVPs.

For speakers, success is knowing where they stand without writing to anyone. They can see a proposal's status, confirm a spot, keep their public profile current and propose the next talk in a few minutes. For organisers, success is running an event's speaker and volunteer pipeline without spreadsheets.

## Positioning

A community's own speaker pipeline, run by volunteers. One speaker profile follows a person across every GDG Sydney event, and a talk can go to a meetup first and DevFest later. Speakers only ever see what organisers have told them by email. Nothing is automated behind an organiser's back.

## Operating Context

- Speakers reach the portal through emailed links (proposal confirmation, acceptance, thank-you) and gdgsydney.com/speak.
- Sign-in is a single-use emailed link that lasts 30 minutes, and a session lasts 30 days. Visits are occasional and often on a phone, straight from an email.
- Proposals are reviewed by people. Decisions reach speakers by email first, and the portal mirrors them.

## Capabilities and Constraints

- **Speaker portal:**
  - Magic-link sign-in.
  - A dashboard listing every profile, talk, proposal and saved talk on the signed-in address.
  - Profile edits (tagline, bio, links, photo) that go live at once.
  - Proposing to a meetup any time, or to DevFest while its Call for Speakers is open.
  - Editing a pending proposal, or an accepted talk until its event.
  - Saved talks to propose later.
- **Proposal status** shows only what the speaker has been told: Sent, Under review, Accepted, Confirmed. "Not selected" and "event passed" are end states.
- **Data and stack:** Next.js App Router, Tailwind v4, Firebase (Firestore through the Admin SDK only, Storage for photos), Resend for email. All content comes from Firestore. Ticketing is Humanitix; there is no payment code.
- **Not built:** withdrawing a proposal, and co-speakers seeing a proposal filed under the lead's address.
- **Undecided:** a typical reply time for proposals.

## Brand Commitments

- **Same family as gdgsydney.com.** The whole app, admin and speaker portal included, stays recognisably part of gdgsydney.com: dark Black 02 page, the GDG Sydney logo (not the DevFest wordmark), Google Sans and Google Sans Mono, and the Google core colours with the contrast variants in BRANDING.md. Speakers arriving from gdgsydney.com/speak shouldn't feel they've left. Confirmed 2026-11-18 for the portal redesign.
- **Naming:** "Google Developer Groups" in full on first use, then "GDG Sydney".
- **Voice:** plain, warm and direct, in Australian English. No em-dashes in copy.
- **Assets:** BRANDING.md holds the palette, fonts and logo rules.

## Evidence on Hand

- **Real data:** speaker profiles, talks and proposals from DevFest 2026 and the 2026 meetups are in Firestore.
- **No marketing evidence:** there are no testimonials, metrics or press for the portal itself, and none should be invented.

## Product Principles

1. **Tell speakers where they stand.** Status and the next action come before anything else, and the portal never shows a decision the speaker hasn't been told.
2. **Respect a rare visitor.** Someone who visits twice a year should understand the page at a glance, on a phone, straight from an email.
3. **One person across every event.** Profiles, talks and saved ideas carry from meetup to DevFest and back.
4. **People decide; the software records.** Every email and decision is an organiser's explicit act.

## Accessibility & Inclusion

WCAG AA throughout: 4.5:1 for normal text, 3:1 for large text and control boundaries, visible focus, and a descriptive `aria-label` on every interactive element. Motion respects `prefers-reduced-motion`. Form errors show under the field, and server errors go to the bottom-left alert, which stays until dismissed.
