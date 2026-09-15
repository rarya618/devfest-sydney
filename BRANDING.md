# GDG Brand Guide — DevFest Sydney

Sources:
- [External] Google Developer Groups - Brand Guide for Organizers
- [External] DevFest 2026 Brand Assets (Google Slides) — asset library of official DevFest logos, key art, digital/social/print templates. Reference this deck when a design task needs an official DevFest asset (logo files, signage, social templates) rather than a hand-built equivalent. Confirms the same core/halftone/pastel/greyscale palette as below. Brand questions: contact your regional lead or gdg-support@google.com.

## Brand Messaging

- The program umbrella name is **Google Developer Groups** (never abbreviated on first use).
- Each group is **Google Developer Group [City]** or **GDG [City]** — e.g. GDG Sydney.
- On social media, organisers are **GDG Organizer** (not GDG Lead or Google Developer Group Lead).

## Typography

### Primary — Google Sans
The main typeface. Use **Bold** for titles and large sentences; **Regular** for body copy and smaller text. Do not use Bold for everything — the contrast between weights is intentional.

| Weight | Use |
|--------|-----|
| Regular (400) | Body copy, captions, form labels |
| Bold (700) | Headings, CTAs, hero text |

### Secondary — Google Sans Mono
Used for short lines, speaker names, data labels, and anywhere a "code-style" feel is needed. Not for long-form body copy.

**Implementation:** Local Google Sans and Google Sans Mono files in `src/fonts/`, subset to Latin and served as woff2, declared via `@font-face` in `globals.css` at weights 400, 500 and 700. Mapped to `--font-sans` and `--font-mono` in the `@theme` block.

## Color Palette

### Core Colors (use these for all digital work)

| Name | Hex | Usage |
|------|-----|-------|
| Blue 500 | `#4285F4` | Primary CTA, links, Developer Track accent |
| Green 500 | `#34A853` | Success states, Builder Track accent |
| Yellow 600 | `#f9ab00` | Warnings, Builder Showcase accent, Workshops Track accent |
| Red 500 | `#EA4335` | Errors, Speaker/CfS accent |

### Halftone Colors

| Name | Hex |
|------|-----|
| Halftone Blue | `#57caff` |
| Halftone Green | `#5cdb6d` |
| Halftone Yellow | `#ffd427` |
| Halftone Red | `#ff7daf` |

### Pastel Colors

| Name | Hex |
|------|-----|
| Pastel Blue | `#c3ecf6` |
| Pastel Green | `#ccf6c5` |
| Pastel Yellow | `#ffe7a5` |
| Pastel Red | `#f8d8d8` |

### Greyscale

| Name | Hex |
|------|-----|
| Off White | `#f0f0f0` |
| Black 02 | `#1e1e1e` |

### Contrast Variants (site-only, not in the GDG guide)

The core fills reach only 3.1 to 3.9:1 against white, which fails WCAG AA for the 16px button labels used across the site. Solid buttons that carry white text therefore use deeper shades from the Google Material palette, and red text on the dark page uses a lighter one. Keep the core colours for accents, outlines, tints and large type.

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Blue 700 | `#1967d2` | `bg-google-blue-deep` | Solid blue button fills with white text |
| Green 700 | `#188038` | `bg-google-green-deep` | Solid green button fills with white text |
| Red 600 | `#d93025` | `bg-google-red-deep` | Solid red button fills with white text |
| Red 300 | `#f28b82` | `text-google-red-light` | Red text on dark surfaces (errors, destructive actions) |
| Blue 300 | `#8ab4f8` | `text-google-blue-light` | Blue text on a blue tint (the admin status and track chips) |

Minimum text opacity on the dark page is `text-white/50` (5.3:1). Anything lower is decorative only.

`bg-google-blue-deep` was Blue 600 (`#1a73e8`) until the admin contrast pass measured it at 4.48:1 against white, just under AA, and moved it down a step to 5.41:1.

`text-google-blue-light` exists because the core blue is fine as plain text on a dark card (5.3:1) but drops to 4.5:1 once it sits on its own `bg-google-blue/15` tint, which is how every admin chip is built. Green and yellow clear AA on the same tint, so they stay on the core colours; only blue needed the lighter variant.

### Interactive States (site-only)

- **Control boundaries** need 3:1, so any border that is the only edge of a control (outline buttons, text inputs, selects) uses `border-white/35` or stronger. `border-white/10` and `/15` are for decorative card and panel outlines only, where the fill already separates the surface.
- **Focus indicators** must be at least as visible as the resting state. Inputs pair `focus:border-google-blue` (solid, 5.2:1) with `focus:ring-2 focus:ring-google-blue/40`; checkboxes, which have no border of their own, use a solid `focus:ring-google-blue`. A translucent focus colour is not enough on its own: `focus:border-google-blue/50` measured 1.96:1, lower than the 3.02:1 border it replaced, so focusing an input actually made it harder to see.

> CMYK values are for print only. Use RGB/hex for all digital work.

## Logo

- The **horizontal logo** is preferred.
- The **stacked logo** is an alternative when space is limited.
- Both formats must maintain a strong visual affiliation with Google.
- Do not alter, recolour, or distort the logo.
- Include ample clear space all the way around the logo artwork (per the DevFest brand assets deck).
- DevFest-specific lockups (in addition to the general GDG logo above): primary DevFest wordmark, wordmark with year, and an editable-location lockup (e.g. "DevFest New York") for city-specific branding. Use these when an asset specifically needs to read as a DevFest lockup rather than the plain GDG logo.

## Implementation Notes

- Google colors are defined as Tailwind utilities: `text-google-blue`, `bg-google-red`, etc. in `tailwind.config.ts`.
- The yellow in the codebase is `#f9ab00` (Yellow 600) — **not** `#FBBC05`.
- Use `font-mono` Tailwind class to apply Google Sans Mono for code-style accents.
