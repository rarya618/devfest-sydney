---
name: GDG Sydney back office
description: The speaker portal and admin at app.gdgsydney.com, in the gdgsydney.com family.
colors:
  google-blue: "#4285F4"
  google-blue-deep: "#1967d2"
  google-blue-light: "#8ab4f8"
  google-green: "#34A853"
  google-green-deep: "#188038"
  google-yellow: "#f9ab00"
  google-red: "#EA4335"
  google-red-deep: "#d93025"
  google-red-light: "#f28b82"
  black-02: "#1e1e1e"
  surface: "#282828"
  surface-raised: "#303030"
  off-white: "#f0f0f0"
typography:
  display:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  badge-name:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
  card-title:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  agenda-heading:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.55
  row-title:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-small:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.43
  hint:
    fontFamily: "Google Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
  data:
    fontFamily: "Google Sans Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  data-small:
    fontFamily: "Google Sans Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
  data-chip:
    fontFamily: "Google Sans Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1
rounded:
  input: "8px"
  alert: "12px"
  option: "16px"
  photo: "22px"
  panel: "24px"
  badge: "28px"
  pill: "9999px"
spacing:
  gutter: "16px"
  gutter-sm: "24px"
  row: "20px"
  panel: "24px"
  panel-sm: "32px"
  card-sm: "36px"
  section: "56px"
  column-gap: "80px"
components:
  button-primary:
    backgroundColor: "{colors.google-blue-deep}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
  button-primary-small:
    backgroundColor: "{colors.google-blue-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.off-white}"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
  button-confirm-large:
    backgroundColor: "{colors.google-green-deep}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
  button-danger-outline:
    backgroundColor: "transparent"
    textColor: "{colors.google-red-light}"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
  button-danger:
    backgroundColor: "{colors.google-red-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
  button-confirm:
    backgroundColor: "{colors.google-green-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
  chip:
    backgroundColor: "rgba(255,255,255,0.06)"
    textColor: "rgba(255,255,255,0.7)"
    typography: "{typography.data-chip}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  speaker-badge:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.off-white}"
    rounded: "{rounded.badge}"
    padding: "40px 20px 24px"
    width: "320px"
  speaker-badge-band:
    backgroundColor: "{colors.google-blue-deep}"
    textColor: "#ffffff"
    padding: "8px 0"
  agenda-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.off-white}"
    typography: "{typography.card-title}"
    rounded: "{rounded.badge}"
    padding: "28px 24px"
  agenda-card-empty:
    backgroundColor: "transparent"
    textColor: "{colors.off-white}"
    typography: "{typography.card-title}"
    rounded: "{rounded.badge}"
    padding: "32px 24px"
  agenda-pill:
    backgroundColor: "transparent"
    textColor: "{colors.off-white}"
    typography: "{typography.body-small}"
    rounded: "{rounded.pill}"
    padding: "8px 16px 8px 12px"
  stage-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.badge}"
    padding: "{spacing.panel}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  input:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    padding: "10px 20px"
  input-error:
    backgroundColor: "rgba(234,67,53,0.05)"
    textColor: "#ffffff"
    rounded: "{rounded.input}"
    padding: "10px 20px"
  alert:
    backgroundColor: "{colors.surface-raised}"
    textColor: "rgba(255,255,255,0.8)"
    typography: "{typography.body-small}"
    rounded: "{rounded.alert}"
    padding: "12px 16px"
---

# Design System: GDG Sydney back office

## Overview

**Creative North Star: "The Badge You'll Wear on the Day"**

The back office lives on the same dark Black 02 page as gdgsydney.com, so a speaker arriving from `/speak` never feels they have left. Its signature is the speaker portal's badge: the speaker's public profile drawn as a lanyard badge, striped strap and all, with their speaking year beside it: a ruler from six months back to six ahead, today in the middle, over one large card for the talk that matters now. Everything else is quiet on purpose. Flat opaque grey surfaces, pill buttons, sentence-case labels and one bright stripe of the four Google core colours do the brand work, and the content carries the rest.

Density is low and the reading is fast: a returning speaker visiting twice a year should see their badge, what needs them, and what is next on the first phone screen. Colour is functional before it is decorative. Green means something is in or waiting on you, yellow means it is being read, blue is the action, and quiet white means it is over. The motion has one curve, an exponential ease-out that arrives confidently and settles, and it all falls away for people who prefer reduced motion.

BRANDING.md is the authority on the palette, the contrast variants, the surface treatment and the interactive-state rules. This file records how the shipped build applies them.

**Key Characteristics:**
- Dark Black 02 page with opaque `#282828` and `#303030` surfaces, no translucent cards.
- Google Sans for everything people read; Google Sans Mono only for dates, times and short data labels.
- Pill buttons throughout; solid fills only in the deep contrast variants.
- The speaker badge on its GDG lanyard as the one signature object, with the year ruler and its agenda card as its companion.
- A single ease curve, `cubic-bezier(0.16, 1, 0.3, 1)`, for every portal transition.

## Colors

The Google core colours on a dark grey ground, with BRANDING.md's deeper and lighter contrast variants wherever text has to pass AA.

### Primary
- **Google Blue** (`google-blue`): focus rings, input focus borders, selected option borders, the Developer track dot. Never a solid fill behind white text.
- **Blue 700, the action blue** (`google-blue-deep`): every primary button fill and the "Speaker" band across the badge. The one blue that carries white text.
- **Blue 300** (`google-blue-light`): inline text links on dark surfaces and blue text on a blue tint.

### Secondary
- **Google Green** (`google-green`): status that is good or waiting on the speaker: ruler markers and pill dates for talks in or coming up, the agenda card's status line and current step, done steps and the rules between them, the card's hairline (45%) when a spot waits to be confirmed, "Confirm by" dates, save confirmations, the "Needs you" strip's border (30%) and tint (10%).
- **Green 700** (`google-green-deep`): the Confirm button fill, the one solid green.

### Tertiary
- **Google Yellow** (`google-yellow`): proposals under review (their ruler marker, pill dot and date, status line and current step), "Unsaved changes", "Add a photo to finish it" nudges. Text and small status dots only in the portal, never a fill.
- **Google Red** (`google-red`): the error alert's border (40%) and icon tint, the input error tint (5%), the Spotlight track dot.
- **Red 600** (`google-red-deep`): solid destructive buttons.
- **Red 300** (`google-red-light`): all red text on dark: field errors, required asterisks, destructive outline buttons, the alert icon.

### Neutral
- **Black 02** (`black-02`): the page, overscroll included, and the sticky header at 90% (80% behind a backdrop blur). Also the badge's punched slot and the clip's slot.
- **Card grey** (`surface`): the badge, dashboard panels, saved-talk editors.
- **Raised grey** (`surface-raised`): the error alert and the lanyard clip, anything sitting above a card.
- **Off White** (`off-white`): headings and primary text, the year ruler's line (85%), its today line, and the selected marker's outline (70%).
- **White at opacity**: body copy at 70%, secondary lines at 60%, ruler month labels and todo steps at 55%, the floor at 50% (BRANDING.md). Dividers at 10%, decorative outlines at 15%, month ticks at 30%, control boundaries at 35%. Markers for talks that are over are 40% white dots.

### Named Rules
**The Deep Fill Rule.** A solid button with white text is always a deep variant (Blue 700, Green 700, Red 600). The core colours stay for accents, outlines, tints and text.

**The Status Colour Rule.** In the agenda, colour is the status, the same on the ruler marker, the pill, the card's status line and its current step: green for to confirm, confirmed or coming up, yellow for under review, white (60% text, 40% dot) for given, not selected or passed. Words always say the same thing; colour is never the only signal.

**The Four Colours, Once Rule.** The four core colours appear together only in the lanyard strap. Elsewhere a card or row shows at most one track colour, as a small dot inside a chip.

## Typography

**Display Font:** Google Sans (with sans-serif)
**Label/Mono Font:** Google Sans Mono (with monospace)

**Character:** One humanist sans for every word people read, Bold for headings and actions and Regular for prose, with the mono reserved for the things that are data: dates, deadlines, counts, event kinds. Weights are 400, 500 and 700 only; the portal uses 400 and 700, and there are no italics.

### Hierarchy
- **Display** (700, clamp(2.25rem, 6vw, 3.5rem), 1.02, -0.02em): full-page headings on the rare single-message pages (the portal's error state). Balanced wrapping.
- **Headline** (700, clamp(1.75rem, 4vw, 2.25rem), 1.25, -0.01em): the page's h1: "Your agenda", "Sign in to speak with us."
- **Card title** (700, clamp(1.5rem, 3vw, 2.25rem), 1.12, -0.01em): the talk's title on the agenda card and the empty-year card's line. Balanced wrapping; white at 80% once the talk is over.
- **Badge name** (700, 1.5rem, 1.25): the speaker's name on the badge. A paragraph, not a heading, because the badge sits before the page's h1.
- **Title** (700, 1.25rem): panel headings ("Edit your badge", "Propose a talk").
- **Agenda heading** (700, 1.125rem): the Saved talks heading and the "Needs you" strip's heading.
- **Row title** (700, 1rem, 1.375): a talk's title in a saved-talk row or the "Needs you" strip.
- **Body** (400, 1rem, 1.625): prose and form values. Body small (0.875rem) for secondary lines, notes and the badge bio.
- **Label** (700, 0.875rem, white at 85%): form labels and legends, sentence case.
- **Hint and error** (400, 0.75rem): hints at white 50%, errors in Red 300, both under the field.
- **Data** (Mono 400, 0.875rem): saved-talk counts, deadlines. **Data small** (Mono 400, 0.75rem): ruler month labels, step dates, pill dates. **Data chip** (Mono 400, 0.75rem, line-height 1): event kind and track chips.

### Named Rules
**The Mono Is Data Rule.** Google Sans Mono sets dates, deadlines, counts and short metadata. Never names, titles, labels or body copy.

**The Sentence Case Rule.** Labels, buttons and headings are sentence case. No ALL-CAPS mono eyebrows above headings, and no line above the agenda card's title. The small "Idea" or "Proposed" line in a saved-talk row and the "DevFest" or "Meetup" label over a ruler marker are data labels paired with their data, not kickers.

## Layout

Content sits in a centred container with a 16px gutter (24px from 640px): `72rem` wide for the dashboard, `42rem` for single-column forms and sign-in. Pages start 24px under the header (40px from 640px) and leave 64px (96px) at the foot. The sticky header is 80px tall, the logo on the left and Sign out on the right.

The dashboard is one column on phones: the "Needs you" strip (phones only), the badge on its lanyard (max 320px, centred) with Edit badge and Propose a talk under it, then "Your agenda". From 1024px it becomes two columns, `minmax(0, 340px)` and `minmax(0, 1fr)` with an 80px gap: the badge on the left, sticky at 96px from the top only when the window is at least 820px tall, and the agenda on the right with Propose a talk beside its heading. With nothing on the year yet, the empty card's button is the only Propose a talk.

The agenda column reads top to bottom as one stage. The year ruler runs the column's full width, 40px under the heading (48px from 640px), with 48px (56px) of headroom above its line for the today label and marker labels. The agenda card sits 56px below the line, joined to the selected marker by a 36px drop line. The other talks follow as a wrapping row of pills 24px under the card, then Saved talks 40px below. Forms (edit badge, propose, edit proposal) take the card's place, one at a time, and the page scrolls to them only if their top is off the comfortable part of the screen.

Saved talks keep the row grid: a label column of 5.75rem (7.5rem from 640px), a 16px gap, then the content, rows separated by a 10% white top rule and 20px of vertical padding. Field groups in forms are 28px apart, form sections 48px.

## Elevation & Depth

Flat by default. Cards and panels, the agenda card included, are opaque grey fills a step lighter than the page, with no shadow and at most a 6% white ring; depth comes from tone (Black 02, then `#282828`, then `#303030`). The badge is the one lifted object: it hangs, so it casts a soft, low, downward shadow, and its clip has a small one of its own. The error alert floats above everything with a standard extra-large shadow.

### Shadow Vocabulary
- **Badge hang** (`box-shadow: 0 24px 48px -20px rgba(0,0,0,0.7)`): the speaker badge and the sign-in badge only.
- **Clip** (`box-shadow: 0 4px 8px -2px rgba(0,0,0,0.5)`): the lanyard clip.
- **Punched slot** (`box-shadow: inset 0 1px 2px rgba(0,0,0,0.6)`): the slot cut into the top of a badge.
- **Floating alert** (Tailwind `shadow-xl`): the bottom-left error alert.
- **Floating menu** (`box-shadow: 0 12px 32px rgba(0,0,0,0.45)`): the admin's More menus and the dropdown's open list, which float over the content they belong to.

### Named Rules
**The Only Thing That Hangs Rule.** Only the badge casts a shadow. Panels, cards, strips and rows stay flat and separate by tone. Things that float above the page for a moment (the alert, menus, the dropdown's list) are the exception.

## Shapes

Round, soft and consistent. Every button and chip is a full pill. Containers step down in radius as they get smaller: the badge, the agenda card and the form that takes its place at 28px, section panels, saved-talk editors, success boxes and the "Needs you" strip at 24px, the badge photo at 22px, option cards and inline callouts at 16px, the alert at 12px, inputs and skeleton bars at 8px. The badge carries a punched slot (28 by 8px pill in Black 02) 16px from its top, and the photo is a centred square at 52% of the badge's width (max 176px). The lanyard strap is 16px wide with 3px bottom corners. The year ruler is all round ends: a 2px line, a 2px today line, round 14px markers and round step dots.

## Components

### Buttons
Confident pills that give slightly under the finger.
- **Shape:** full pill (9999px).
- **Primary:** Blue 700 fill, white Bold text at 16px, 10px by 24px. One per view: Propose a talk on the dashboard, Send or Save in a form. A small variant (14px, 8px by 20px) sits beside secondary buttons in a row.
- **Secondary:** transparent with a 35% white border, off-white Bold 14px, 8px by 20px; enlarged to 16px and 10px by 24px when it sits beside a primary (Edit badge).
- **Confirm:** Green 700 fill, white, only for confirming a spot. Full size (16px, 10px by 24px) on the agenda card, ringed over `#282828`; small in the "Needs you" strip.
- **Danger:** Red 600 fill for a destructive commit; a danger outline (35% border, Red 300 text) for Remove photo or Discard changes.
- **Hover:** solid fills drop to 85% opacity; outlines brighten the border to solid white.
- **Focus:** a 2px Google Blue ring, offset 2px over Black 02 on solid buttons. Danger fills ring in Red 300.
- **Press:** scales to 0.97 over 160ms on the settle curve (`.press`). Disabled is 50% opacity.

### Chips
- **Style:** a 6% white pill, Google Sans Mono 12px at white 70%, 4px by 10px. Event kind ("DevFest" or "Meetup") and the DevFest track, which leads with a 6px dot in the track's core colour (white for Keynote). The dot is decoration; the word carries the meaning.
- **Link chips:** on the badge, links (LinkedIn, GitHub, Website) are outline pills: 35% border, Bold 12px at white 80%, brightening to 70% on hover.

### Cards / Containers
- **Stage panel:** the dashboard's forms (edit badge, propose, edit proposal). `#282828`, 28px radius, a 6% white ring, 24px padding (36px from 640px). It takes the agenda card's place with the stage morph and receives focus on its heading.
- **Section panel:** saved-talk editors. `#282828`, 24px radius, 24px padding (32px from 640px), no border, no shadow. The new-talk editor opens with the panel reveal (see motion below).
- **Needs you strip:** phones only. A 24px-radius block with a 30% Google Green border on a 10% green tint, above the badge whenever a spot waits to be confirmed, headed "You're in. Confirm your spot." Each item is the talk title, the event and a deadline in green, and a Confirm button. On a wide screen the agenda card already opens on that talk.
- **Success box:** a 10% green tint at 24px radius with a Google Green title.
- **Inline callout:** a 15% white outline at 16px radius, no fill.

### Inputs / Fields
- **Style:** 5% white fill, 35% white border, 8px radius, 10px by 20px, white 16px text, placeholders at white 60%.
- **Focus:** fill rises to 8%, the border goes solid Google Blue and a 2px ring at 40% blue sits outside it.
- **Error:** the border goes Red 300 over a 5% red tint, and the message sits under the field in Red 300 at 12px, tied in with `aria-describedby`.
- **Dropdowns:** never a native `<select>`, whose open list the browser draws. `src/components/Select.tsx` (a select-only combobox) takes the field's own classes closed, with a 16px chevron at white 70% that turns over as it opens. The open list sits in the top layer, 6px from the field: `#303030`, a 10% white outline, 16px radius, 6px padding, the floating menu shadow, as wide as the field (a small pill picker may grow to 320px) and up to 320px tall, opening upward when there is more room above. Rows are 8px-radius, white at 80%, 8% white behind the highlighted one (12px tall padding on touch); the chosen one is Bold off-white with a Google Blue tick. It fades in, settling 4px toward the field, over 180ms on the settle curve. Long labels wrap.
- **Options:** radio choices are 16px-radius cards (35% border, 4% fill); selected is a Google Blue border on a 15% blue tint. Checkboxes are 20px, `accent-color` Google Blue, with a solid blue focus ring.
- **Labels and hints:** Bold 14px label above, 12px hint below at white 50%.

### Navigation
- **Header:** sticky, 80px, Black 02 at 90% with a medium backdrop blur. The GDG Sydney logo (24px tall, 32px from 640px) links home; signed in, a secondary pill reads Sign out. Signed out, the logo stands alone. It stays put while page content below it changes.

### Speaker Badge (signature)
The speaker's public profile as a badge hanging from a GDG lanyard.
- **Strap:** four equal vertical stripes in Google Blue, Red, Yellow and Green, 16px wide, 40px tall on phones and 80px from 640px (40 and 64px on sign-in).
- **Clip:** a 40 by 20px `#303030` block with a 15% white outline, 8px radius, its own small shadow and a Black 02 slot.
- **Badge:** `#282828`, 28px radius, a 6% white ring, the hang shadow, centred text. Punched slot, square photo (or initials at white 30% with "No photo yet"), name, tagline at white 70%, then the full-bleed "Speaker" band in Blue 700, then the bio (clamped to its first block) and link chips. On phones outside the editor it shows only down to the band.
- **Resting tilt:** -1.2deg, pivoting on the clip. The sign-in badge hangs level and holds the form.
- **Live preview:** while the profile editor is open the badge updates as the speaker types.

### Year Ruler (signature)
The speaker's year at a glance: six months back, six ahead, today in the middle, each talk placed where its event falls.
- **Line:** a 2px off-white line at 85%, full column width. Month ticks are 1px by 8px at white 30% hanging under it, labelled 14px below in Google Sans Mono 12px at white 55%. The year rides on January ("Jan '27"), or on the next month shown if January's label is dropped. Phones show every other month.
- **Today:** a 2px solid off-white line standing up through the ruler, labelled "Today" in Bold 12px off-white above it.
- **Markers:** buttons, 32px hit areas holding a 14px dot in the state colour, cut out of the line by a 5px Black 02 ring. Hover or selection scales the dot to 1.25; the selected one adds a 2px off-white outline at 70%, offset 5px. From 640px each carries its event label ("DevFest", "Meetup") in Bold 12px state colour above it. A month label that would sit under a marker is dropped.
- **Drop line:** a 1px, 36px line fading from transparent to off-white 45%, from the selected marker down to the card, so the year and the card read as one. Hidden while a form holds the stage.

### Agenda Card
The talk that matters now, opening on a spot to confirm, then the soonest talk ahead, then the newest proposal in review, then the most recent past one.
- **Shape:** `#282828`, 28px radius, 28px by 24px padding (36px all round from 640px), a 6% white ring, swapped for a 45% Google Green hairline only when a spot waits to be confirmed.
- **Content:** the card title, then a 16px line at white 70% with the event, date and any co-speakers. A track chip if it has one. For every state but confirm, a Bold status line in the state colour under them ("On stage in 52 days", "Under review since 20 Oct", "Not selected this time"); a confirm reads straight off its current step. Nothing above the title.
- **Step track:** an evenly divided row of steps (Sent, In review or Accepted, Confirm or Confirmed, On stage; two steps for a talk with no proposal of its own). 12px dots joined by 2px rules: done is solid Google Green with a green rule, current is the state colour with a 4px white 10% halo, todo is a hollow 35% white ring on a 15% rule. Labels at 14px (current Bold off-white, done white 70%, todo white 55%), each with its mono 12px date ("since 20 Oct", "by 3 Dec") in the state colour when current.
- **Actions:** 36px under the steps: Confirm your spot, Edit proposal or Edit your talk (secondary, full size), or Propose it again (primary) for a talk not selected.
- **Other talks:** each other item as an outline pill under the card: 35% white border brightening to 70% on hover, 8px by 16px (12px on the left), a 10px state dot, the mono date in the state colour, and the Bold title truncated. On phones they are the main way to switch.
- **Empty year:** a dashed 30% white outline at 28px radius, no fill: "Propose a talk and it lands here.", a line on how meetups and DevFest take talks, and the primary Propose a talk.

### Saved Talk Row
- The surviving row grid: the label column holds a 12px label at white 60% ("Idea", "Proposed") over a 14px mono count at white 60% ("Not sent", "Once"); the content column holds the Bold title, a two-line abstract at white 60%, where it has been proposed, and actions aligned right from 640px.

### Alert
- The app's only error surface, anchored bottom-left (16px inset, 24px from 640px, full width less the gutters on phones, max 24rem). `#303030` with a 40% red border, 12px radius, 12px by 16px, a small red-tinted circle icon, 14px text at white 80%, and a dismiss button. It rises 12px and fades in over 300ms and stays until dismissed.

### Skeletons
- Placeholders shaped like the page: 8% white bars at 8px radius, pulsing. The dashboard skeleton draws the strap, clip and a tilted badge outline so the badge lands where its placeholder stood. No spinners.

### Motion
One curve, `--ease-settle: cubic-bezier(0.16, 1, 0.3, 1)`, for every portal transition.
- **Badge swing:** once per visit (recorded in sessionStorage), the badge drops 28px from -10deg and swings as a damped pendulum (5deg, -2.6deg, 0.6deg) to rest, over 1150ms. Later loads, second badges and the sign-in badge arrive instead: 8px rise and fade over 400ms.
- **Tilt and sheen:** on fine pointers only, the badge tilts up to 7deg toward the pointer, following in 150ms and returning in 700ms, with a radial 9% white sheen fading in over 500ms. Never on a badge holding a form.
- **Page in:** content fades and rises 6px over 280ms; the header does not move.
- **Ruler arrival:** the today line draws up from its foot over 600ms after 150ms, then each marker pops in from 40% scale and transparent over 500ms, staggered 70ms per marker after 450ms, capped at the sixth.
- **Stage morph:** choosing a marker or pill, or opening or closing a form, runs as a view transition of the stage alone (`agenda-stage`): the box glides to its new size over 450ms while the old content fades out over 180ms and the new fades in over 320ms after 80ms. The rest of the page does not move. Browsers without view transitions swap at once.
- **Rows:** saved-talk rows and the "Needs you" strip rise 10px and fade in over 450ms, staggered 45ms per row after 120ms, capped at the sixth row.
- **Section panels:** the new saved-talk editor's height animates from 0fr to 1fr over 420ms with opacity over 260ms; closing is quicker, 300ms and 180ms, and the panel stays mounted until it finishes.
- **Press:** 0.97 scale over 160ms.
- **Reduced motion:** no swing, tilt, travel, stagger, ruler draw, marker pop, stage morph or press scale; every remaining transition and animation is cut to 0.01ms, so panels, the card and colours change state at once. Scrolling to a panel is instant.

## Do's and Don'ts

### Do:
- **Do** keep the page Black 02 and build depth from the `#282828` and `#303030` surfaces, not translucent white cards.
- **Do** fill solid buttons with the deep variants (Blue 700, Green 700, Red 600) and keep them pills.
- **Do** colour agenda status the same everywhere it shows (marker, pill, status line, current step: green, yellow, white) and say the same thing in words.
- **Do** give every control boundary at least a 35% white border and every focus a solid Google Blue ring or border (BRANDING.md, Interactive States).
- **Do** use `cubic-bezier(0.16, 1, 0.3, 1)` for portal motion, 150 to 300ms for state and 300 to 450ms for panels, and remove travel under reduced motion.
- **Do** put field errors under the field and server errors in the bottom-left alert, which stays until dismissed.
- **Do** use skeletons shaped like the content they stand in for.
- **Do** open dashboard forms in the agenda card's place with the stage morph, never stacked above it.

### Don't:
- **Don't** put white text on the core Google colours; they fail AA at button sizes.
- **Don't** set names, titles or body copy in Google Sans Mono.
- **Don't** add ALL-CAPS mono eyebrows or kickers above headings.
- **Don't** use the four core colours together anywhere but the lanyard strap.
- **Don't** give panels, cards or rows a shadow; only the badge hangs.
- **Don't** tilt or animate a badge that holds a form.
- **Don't** drop text below white 50% on Black 02, or below white 60% for text under 14px on `#303030`.
- **Don't** use spinners or blank sections while data loads.
