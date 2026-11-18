---
version: 1
slug: "src-app-speaker-portal-page-tsx"
primary_target: "src/app/speaker/(portal)/page.tsx"
related_targets: ["src/app/speaker/(portal)/sign-in/page.tsx"]
---

---
version: 1
slug: "src-app-speaker-portal-page-tsx"
primary_target: "src/app/speaker/(portal)/page.tsx"
related_targets: ["src/app/speaker/(portal)/sign-in/page.tsx"]
---

# Speaker portal

Scope: `/speaker` dashboard and its panels, `/speaker/sign-in`, `/speaker/sign-in/verify`. Mode: Operate.
Audience and job: returning community speakers on rare visits, often on a phone from an email, checking where a proposal is up to, confirming a spot, updating their profile, or proposing a talk. First-timers propose.
Constraints: stays in the gdgsydney.com family (PRODUCT.md, BRANDING.md). WCAG AA. Reduced motion respected. No new dependencies unless a motion need can't be met natively.
Decided with the user: a "Needs you" strip sits above the badge whenever a spot is waiting to be confirmed (the user chose the badge-first structure, whose risk was status sitting below it).

## Direction contract

THESIS: The portal is the badge you'll wear on the day. Your public profile is a speaker badge hanging from a GDG lanyard, and your agenda hangs beneath it. It refuses the category default of a greeting, a profile card in a sidebar and stacked list sections.

OWN-WORLD: The Black 02 page and #282828 surfaces. A lanyard strap striped in the four GDG core colours ends in a clip and a punched slot on a 28px-radius badge with a soft offset shadow. The badge has a centred square photo, the name in Google Sans Bold, the tagline, and a Blue 700 "Speaker" band. The agenda is a two-column grid: a Google Sans Mono date column coloured by state (green: coming up or to confirm; yellow: under review; white/50: past), then the title. Buttons are pills.

STORY: The speaker sees themselves as the event will show them, understands what's next from the agenda's date column, and acts with one tap (confirm, propose, edit the badge).

FIRST VIEWPORT: Phone: the header (logo and Sign out), the "Needs you" strip if any, the lanyard and a centred badge about 300px wide, Edit badge and Propose a talk under it, then "Your agenda" starting. Desktop: the badge column (360px, sticky) on the left with its buttons, and the agenda on the right from the top, headed "Your agenda". Propose a talk is the primary action.

FORM: Speaker badge, position 6 on the ordered list (1 Needs-you inbox, 2 Journey spine, 3 Next-stage calendar, 4 Talk passport, 5 List and detail, 6 Speaker badge, 7 Stage board). seed:230ecc2cb2c0bb93. Signature interaction: the badge swings in on its lanyard and settles (once per visit), then tilts toward the pointer with a moving sheen on fine pointers. Motion grammar: exponential ease-out (0.16, 1, 0.3, 1), 150 to 300ms for state, 300 to 450ms for panels, height-animated panels on open and close, a capped stagger for agenda rows on arrival, a 0.97 press on buttons. Reduced motion: no swing, tilt or travel; opacity and colour changes only.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Agenda column contract (2026-11-19, replaces the agenda rows)

Asked for by the user: the right side felt plain, its four sections disjointed and its panels bolted on. It should lead with what's next. Most speakers have one, at most two, talks a year.

THESIS: Your speaking year at a glance. A rolling ruler from six months back to six ahead, with today in the middle and each talk placed where it falls, above one large card for the talk that matters now. It refuses stacked status lists and a form box shoved on top.

OWN-WORLD: The same Black 02 and #282828 world as the badge. The ruler is a 2px off-white line with month ticks in Google Sans Mono and a bright today line. Markers are state-coloured dots (green: in or coming up, yellow: under review, white/45: done), with event labels. The card is #282828, radius 28px, a green hairline when it needs an action, a 2.25rem bold title, and a step track (Sent, Accepted, Confirmed, On stage) with mono dates.

STORY: The speaker sees where their talks sit in the year, knows at once what's next and what's left to do, and acts from the card.

FIRST VIEWPORT: Desktop: "Your agenda" with Propose a talk, the ruler full width under it, a thin line dropping from the selected marker to the card, then the card for the next item: title, event and date, a status line under them when the steps don't already say it ("On stage in 52 days", "Under review since 20 Oct"), steps with a date on each, and the action. No line above the title (the craft floor bans kickers; amended after the finish review). Phone: the same under the badge, with every other month labelled and the item pills below the card as labels. An empty year shows only the empty card's Propose a talk.

FORM: Year strip, position 4 on the re-rolled list (1 Spotlight talk, 2 Talk prep checklist, 3 Event-page preview, 4 Year strip, 5 Organiser's note, 6 Stage door, 7 Ideas notebook). seed:96d5d986f839a46a. Signature interaction: selecting a marker or pill morphs the card to that talk (a view transition named agenda-stage), and proposing or editing morphs the same card into its form and back. Arrival: the today line draws, then the markers pop in, staggered. Reduced motion: instant swaps, no draw or pop.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
