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

The back office lives on the same dark Black 02 page as gdgsydney.com, so a speaker arriving from `/speak` never feels they have left. Its signature is the speaker portal's badge: the speaker's public profile drawn as a lanyard badge, striped strap and all, with their agenda hanging beside it. Everything else is quiet on purpose. Flat opaque grey surfaces, pill buttons, sentence-case labels and one bright stripe of the four Google core colours do the brand work, and the content carries the rest.

Density is low and the reading is fast: a returning speaker visiting twice a year should see their badge, what needs them, and their agenda on the first phone screen. Colour is functional before it is decorative. Green means something is in or waiting on you, yellow means it is being read, blue is the action, and quiet white means it is over. The motion has one curve, an exponential ease-out that arrives confidently and settles, and it all falls away for people who prefer reduced motion.

BRANDING.md is the authority on the palette, the contrast variants, the surface treatment and the interactive-state rules. This file records how the shipped build applies them.

**Key Characteristics:**
- Dark Black 02 page with opaque `#282828` and `#303030` surfaces, no translucent cards.
- Google Sans for everything people read; Google Sans Mono only for dates, times and short data labels.
- Pill buttons throughout; solid fills only in the deep contrast variants.
- The speaker badge on its GDG lanyard as the one signature object.
- A single ease curve, `cubic-bezier(0.16, 1, 0.3, 1)`, for every portal transition.

## Colors

The Google core colours on a dark grey ground, with BRANDING.md's deeper and lighter contrast variants wherever text has to pass AA.

### Primary
- **Google Blue** (`google-blue`): focus rings, input focus borders, selected option borders, the progress dots of a proposal, the Developer track dot. Never a solid fill behind white text.
- **Blue 700, the action blue** (`google-blue-deep`): every primary button fill and the "Speaker" band across the badge. The one blue that carries white text.
- **Blue 300** (`google-blue-light`): inline text links on dark surfaces and blue text on a blue tint.

### Secondary
- **Google Green** (`google-green`): status that is good or waiting on the speaker: an upcoming talk's date, "Confirm by" dates, save confirmations, the "Needs you" strip's border (30%) and tint (10%).
- **Green 700** (`google-green-deep`): the Confirm button fill, the one solid green.

### Tertiary
- **Google Yellow** (`google-yellow`): "under review" dates, "Unsaved changes", "Add a photo to finish it" nudges. Text only in the portal, never a fill.
- **Google Red** (`google-red`): the error alert's border (40%) and icon tint, the input error tint (5%), the Spotlight track dot.
- **Red 600** (`google-red-deep`): solid destructive buttons.
- **Red 300** (`google-red-light`): all red text on dark: field errors, required asterisks, destructive outline buttons, the alert icon.

### Neutral
- **Black 02** (`black-02`): the page, overscroll included, and the sticky header at 90% (80% behind a backdrop blur). Also the badge's punched slot and the clip's slot.
- **Card grey** (`surface`): the badge, dashboard panels, saved-talk editors.
- **Raised grey** (`surface-raised`): the error alert and the lanyard clip, anything sitting above a card.
- **Off White** (`off-white`): headings and primary text.
- **White at opacity**: body copy at 70%, secondary lines at 60%, the floor at 50% (BRANDING.md). Dividers at 10%, decorative outlines at 15%, control boundaries at 35%.

### Named Rules
**The Deep Fill Rule.** A solid button with white text is always a deep variant (Blue 700, Green 700, Red 600). The core colours stay for accents, outlines, tints and text.

**The Status Colour Rule.** In the agenda, the date column's colour is the status: green for coming up or to confirm, yellow for under review, white at 60% for past or closed. Words always say the same thing; colour is never the only signal.

**The Four Colours, Once Rule.** The four core colours appear together only in the lanyard strap. Elsewhere a row shows at most one track colour, as a small dot inside a chip.

## Typography

**Display Font:** Google Sans (with sans-serif)
**Label/Mono Font:** Google Sans Mono (with monospace)

**Character:** One humanist sans for every word people read, Bold for headings and actions and Regular for prose, with the mono reserved for the things that are data: dates, deadlines, counts, event kinds. Weights are 400, 500 and 700 only; the portal uses 400 and 700, and there are no italics.

### Hierarchy
- **Display** (700, clamp(2.25rem, 6vw, 3.5rem), 1.02, -0.02em): full-page headings on the rare single-message pages (the portal's error state). Balanced wrapping.
- **Headline** (700, clamp(1.75rem, 4vw, 2.25rem), 1.25, -0.01em): the page's h1: "Your agenda", "Sign in to speak with us."
- **Badge name** (700, 1.5rem, 1.25): the speaker's name on the badge. A paragraph, not a heading, because the badge sits before the page's h1.
- **Title** (700, 1.25rem): panel headings ("Edit your badge", "Propose a talk").
- **Agenda heading** (700, 1.125rem): agenda section headings (Coming up, Proposals, Saved talks) and the "Needs you" strip.
- **Row title** (700, 1rem, 1.375): a talk's title in an agenda row.
- **Body** (400, 1rem, 1.625): prose and form values. Body small (0.875rem) for secondary lines, notes and the badge bio.
- **Label** (700, 0.875rem, white at 85%): form labels and legends, sentence case.
- **Hint and error** (400, 0.75rem): hints at white 50%, errors in Red 300, both under the field.
- **Data** (Mono 400, 0.875rem): agenda dates, deadlines. **Data chip** (Mono 400, 0.75rem, line-height 1): event kind and track chips.

### Named Rules
**The Mono Is Data Rule.** Google Sans Mono sets dates, deadlines, counts and short metadata. Never names, titles, labels or body copy.

**The Sentence Case Rule.** Labels, buttons and headings are sentence case. No ALL-CAPS mono eyebrows above headings; the small "On stage" or "Sent" line in an agenda row is a data label paired with its date, not a kicker.

## Layout

Content sits in a centred container with a 16px gutter (24px from 640px): `72rem` wide for the dashboard, `42rem` for single-column forms and sign-in. Pages start 24px under the header (40px from 640px) and leave 64px (96px) at the foot. The sticky header is 80px tall, the logo on the left and Sign out on the right.

The dashboard is one column on phones: the "Needs you" strip, the badge on its lanyard (max 320px, centred) with Edit badge and Propose a talk under it, then "Your agenda". From 1024px it becomes two columns, `minmax(0, 340px)` and `minmax(0, 1fr)` with an 80px gap: the badge on the left, sticky at 96px from the top only when the window is at least 820px tall, and the agenda on the right with Propose a talk beside its heading. Panels (edit badge, propose, edit proposal) open in place at the top of the agenda column, one at a time, and the page scrolls to them only if their top is off the comfortable part of the screen.

The agenda row is a two-column grid: a date column of 5.75rem (7.5rem from 640px), a 16px gap, then the content. Rows are separated by a 10% white top rule and 20px of vertical padding. Agenda sections are 56px apart. Field groups in forms are 28px apart, form sections 48px.

## Elevation & Depth

Flat by default. Cards and panels are opaque grey fills a step lighter than the page, with no shadow and at most a 6% white ring; depth comes from tone (Black 02, then `#282828`, then `#303030`). The badge is the one lifted object: it hangs, so it casts a soft, low, downward shadow, and its clip has a small one of its own. The error alert floats above everything with a standard extra-large shadow.

### Shadow Vocabulary
- **Badge hang** (`box-shadow: 0 24px 48px -20px rgba(0,0,0,0.7)`): the speaker badge and the sign-in badge only.
- **Clip** (`box-shadow: 0 4px 8px -2px rgba(0,0,0,0.5)`): the lanyard clip.
- **Punched slot** (`box-shadow: inset 0 1px 2px rgba(0,0,0,0.6)`): the slot cut into the top of a badge.
- **Floating alert** (Tailwind `shadow-xl`): the bottom-left error alert.

### Named Rules
**The Only Thing That Hangs Rule.** Only the badge casts a shadow. Panels, strips and rows stay flat and separate by tone.

## Shapes

Round, soft and consistent. Every button and chip is a full pill. Containers step down in radius as they get smaller: the badge at 28px, panels and the "Needs you" strip at 24px, the badge photo at 22px, option cards and inline callouts at 16px, the alert at 12px, inputs and skeleton bars at 8px. The badge carries a punched slot (28 by 8px pill in Black 02) 16px from its top, and the photo is a centred square at 52% of the badge's width (max 176px). The lanyard strap is 16px wide with 3px bottom corners.

## Components

### Buttons
Confident pills that give slightly under the finger.
- **Shape:** full pill (9999px).
- **Primary:** Blue 700 fill, white Bold text at 16px, 10px by 24px. One per view: Propose a talk on the dashboard, Send or Save in a form. A small variant (14px, 8px by 20px) sits beside secondary buttons in a row.
- **Secondary:** transparent with a 35% white border, off-white Bold 14px, 8px by 20px; enlarged to 16px and 10px by 24px when it sits beside a primary (Edit badge).
- **Confirm:** Green 700 fill, white, small size. Only for confirming a spot.
- **Danger:** Red 600 fill for a destructive commit; a danger outline (35% border, Red 300 text) for Remove photo or Discard changes.
- **Hover:** solid fills drop to 85% opacity; outlines brighten the border to solid white.
- **Focus:** a 2px Google Blue ring, offset 2px over Black 02 on solid buttons. Danger fills ring in Red 300.
- **Press:** scales to 0.97 over 160ms on the settle curve (`.press`). Disabled is 50% opacity.

### Chips
- **Style:** a 6% white pill, Google Sans Mono 12px at white 70%, 4px by 10px. Event kind ("DevFest" or "Meetup") and the DevFest track, which leads with a 6px dot in the track's core colour (white for Keynote). The dot is decoration; the word carries the meaning.
- **Link chips:** on the badge, links (LinkedIn, GitHub, Website) are outline pills: 35% border, Bold 12px at white 80%, brightening to 70% on hover.

### Cards / Containers
- **Panel:** `#282828`, 24px radius, 24px padding (32px from 640px), no border, no shadow. Opens with the panel reveal (see motion below) and receives focus on its heading.
- **Needs you strip:** a 24px-radius block with a 30% Google Green border on a 10% green tint, above the badge whenever a spot waits to be confirmed. Each item is the talk title, a deadline in mono green, and a Confirm button.
- **Success box:** a 10% green tint at 24px radius with a Google Green title.
- **Inline callout:** a 15% white outline at 16px radius, no fill.

### Inputs / Fields
- **Style:** 5% white fill, 35% white border, 8px radius, 10px by 20px, white 16px text, placeholders at white 60%.
- **Focus:** fill rises to 8%, the border goes solid Google Blue and a 2px ring at 40% blue sits outside it.
- **Error:** the border goes Red 300 over a 5% red tint, and the message sits under the field in Red 300 at 12px, tied in with `aria-describedby`.
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

### Agenda Row
- A two-column grid: the date column holds a 12px label at white 60% ("On stage", "Sent", "Confirm by", "Idea") over a 14px mono date coloured by status; the content column holds the Bold title, a 14px secondary line at white 60%, chips, and actions aligned right from 640px.
- A proposal row adds a four-step progress track (Sent, Under review, Accepted, Confirmed): 12px dots joined by 2px rules, filled Google Blue up to the current step (Google Green once confirmed), the current dot ringed at 25% blue, the current label Bold.

### Alert
- The app's only error surface, anchored bottom-left (16px inset, 24px from 640px, full width less the gutters on phones, max 24rem). `#303030` with a 40% red border, 12px radius, 12px by 16px, a small red-tinted circle icon, 14px text at white 80%, and a dismiss button. It rises 12px and fades in over 300ms and stays until dismissed.

### Skeletons
- Placeholders shaped like the page: 8% white bars at 8px radius, pulsing. The dashboard skeleton draws the strap, clip and a tilted badge outline so the badge lands where its placeholder stood. No spinners.

### Motion
One curve, `--ease-settle: cubic-bezier(0.16, 1, 0.3, 1)`, for every portal transition.
- **Badge swing:** once per visit (recorded in sessionStorage), the badge drops 28px from -10deg and swings as a damped pendulum (5deg, -2.6deg, 0.6deg) to rest, over 1150ms. Later loads, second badges and the sign-in badge arrive instead: 8px rise and fade over 400ms.
- **Tilt and sheen:** on fine pointers only, the badge tilts up to 7deg toward the pointer, following in 150ms and returning in 700ms, with a radial 9% white sheen fading in over 500ms. Never on a badge holding a form.
- **Page in:** content fades and rises 6px over 280ms; the header does not move.
- **Agenda rows:** each rises 10px and fades in over 450ms, staggered 45ms per row after 120ms, capped at the sixth row.
- **Panels:** height animates from 0fr to 1fr over 420ms with opacity over 260ms; closing is quicker, 300ms and 180ms, and the panel stays mounted until it finishes.
- **Press:** 0.97 scale over 160ms.
- **Reduced motion:** no swing, tilt, travel, stagger or press scale; every remaining transition and animation is cut to 0.01ms, so panels and colours change state at once. Scrolling to a panel is instant.

## Do's and Don'ts

### Do:
- **Do** keep the page Black 02 and build depth from the `#282828` and `#303030` surfaces, not translucent white cards.
- **Do** fill solid buttons with the deep variants (Blue 700, Green 700, Red 600) and keep them pills.
- **Do** colour an agenda date by status (green, yellow, white 60%) and say the same thing in words.
- **Do** give every control boundary at least a 35% white border and every focus a solid Google Blue ring or border (BRANDING.md, Interactive States).
- **Do** use `cubic-bezier(0.16, 1, 0.3, 1)` for portal motion, 150 to 300ms for state and 300 to 450ms for panels, and remove travel under reduced motion.
- **Do** put field errors under the field and server errors in the bottom-left alert, which stays until dismissed.
- **Do** use skeletons shaped like the content they stand in for.

### Don't:
- **Don't** put white text on the core Google colours; they fail AA at button sizes.
- **Don't** set names, titles or body copy in Google Sans Mono.
- **Don't** add ALL-CAPS mono eyebrows or kickers above headings.
- **Don't** use the four core colours together anywhere but the lanyard strap.
- **Don't** give panels or rows a shadow; only the badge hangs.
- **Don't** tilt or animate a badge that holds a form.
- **Don't** drop text below white 50% on Black 02, or below white 60% for text under 14px on `#303030`.
- **Don't** use spinners or blank sections while data loads.
