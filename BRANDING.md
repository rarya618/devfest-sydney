# GDG Brand Guide — DevFest Sydney

Source: [External] Google Developer Groups - Brand Guide for Organizers

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

### Secondary — Google Sans Mono (Roboto Mono substitute)
Used for short lines, speaker names, data labels, and anywhere a "code-style" feel is needed. Not for long-form body copy.

**Implementation:** Local font files (Product Sans TTF) declared as `font-family: 'Google Sans'`. Roboto Mono loaded via Google Fonts as the Mono substitute. Both set as defaults in `tailwind.config.ts`.

## Color Palette

### Core Colors (use these for all digital work)

| Name | Hex | Usage |
|------|-----|-------|
| Blue 500 | `#4285F4` | Primary CTA, links, Developer Track accent |
| Green 500 | `#34A853` | Success states, Builder Track accent |
| Yellow 600 | `#f9ab00` | Warnings, Builder Showcase accent |
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

> CMYK values are for print only. Use RGB/hex for all digital work.

## Logo

- The **horizontal logo** is preferred.
- The **stacked logo** is an alternative when space is limited.
- Both formats must maintain a strong visual affiliation with Google.
- Do not alter, recolour, or distort the logo.

## Implementation Notes

- Google colors are defined as Tailwind utilities: `text-google-blue`, `bg-google-red`, etc. in `tailwind.config.ts`.
- The yellow in the codebase is `#f9ab00` (Yellow 600) — **not** `#FBBC05`.
- Use `font-mono` Tailwind class to apply Google Sans Mono (Roboto Mono) for code-style accents.
