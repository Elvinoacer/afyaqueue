---
name: AfyaQueue Clinical Motion
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3f4940'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6f7a70'
  outline-variant: '#bec9be'
  surface-tint: '#066d3a'
  primary: '#006032'
  on-primary: '#ffffff'
  primary-container: '#1e7a46'
  on-primary-container: '#adffc2'
  inverse-primary: '#81d99b'
  secondary: '#2e58bd'
  on-secondary: '#ffffff'
  secondary-container: '#7297ff'
  on-secondary-container: '#002c7c'
  tertiary: '#913500'
  on-tertiary: '#ffffff'
  tertiary-container: '#b6480b'
  on-tertiary-container: '#ffe8df'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9df6b6'
  primary-fixed-dim: '#81d99b'
  on-primary-fixed: '#00210d'
  on-primary-fixed-variant: '#00522a'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b3c5ff'
  on-secondary-fixed: '#00174a'
  on-secondary-fixed-variant: '#063fa4'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb597'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  brand-green-soft: '#E6F4EC'
  brand-blue-soft: '#EBF1FF'
  brand-navy: '#16264A'
  brand-accent-rust: '#C1541A'
  surface-card: '#FFFFFF'
  border-subtle: '#E2E8F0'
  text-muted: '#64748B'
  status-danger: '#DC2626'
typography:
  display-giant:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-giant-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.025em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
  overline:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '800'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system embodies modern clinical precision, human warmth, and operational velocity. Designed for Moi Teaching and Referral Hospital, it bridges high-stakes hospital logistics with an empathetic, anxiety-reducing patient experience. 

### Visual Movement: Clinical Modernism
The aesthetic balances structured healthcare utility with high-polish consumer mobility. It avoids cold, sterile enterprise conventions in favor of a crisp, luminescent canvas paired with decisive focal anchors.
- **Deep Trust & Authority:** Established via rich forest green and saturated royal blue, grounding clinical workflows in dependability.
- **Immediate Legibility:** Emphasizes high-contrast deep navy typography and oversized numerical displays visible from arm's-length or bright outdoor hospital corridors.
- **Urgent Actionability:** Leverages a vibrant terracotta-orange CTA token reserved strictly for decisive actions (`Confirm Booking`, `Call Next Patient`), preventing user hesitation.
- **Physical Demarcation:** Employs pill badges, subtle surface tints, and hairline containment strokes instead of aggressive drop shadows, generating an airy, ordered interface.

## Colors

The color architecture enforces clear semantic roles across both Patient and Hospital Staff interfaces.

### Role Allocation
- **Primary (`#1E7A46` - Brand Forest Green):** Denotes operational readiness, active service states, verified medical practitioners, and primary institutional brand touchpoints.
- **Secondary (`#2752B7` - Royal Blue):** Reserved for system-level context, active queue monitors, live session cards, and informational focus states.
- **Tertiary (`#F27438` - Vibrant Orange):** The exclusive conversion and dispatch trigger. Never used for static decoration; applied only to active buttons requiring decisive user action (`Confirm Booking`, `Call Next Patient`, `Log In`).
- **Neutral (`#F8FAFC` - Slate Crisp):** Canvas background that eliminates glare while maintaining a clean, sanitary digital tone.
- **Brand Navy (`#16264A`):** The primary text and counter color. Provides extreme contrast against light surfaces without the stark harshness of pure black.

### Surface Tints & Status Roles
- **Soft Green (`#E6F4EC`):** Fills container backgrounds for "Now Serving", active consultation statuses, and positive confirmations.
- **Soft Blue (`#EBF1FF`):** Powers informational callouts, circular queue counter interiors, and active table-row indicators.
- **Subtle Border (`#E2E8F0`):** Defines physical card bounds and unselected interactive elements without cluttering viewports.
- **Danger (`#DC2626`):** Dedicated to appointment cancellations, missed calls, and destructive warnings.

## Typography

The type scale pairs **Plus Jakarta Sans** for expressive, humanistic headings and quantitative labels with **Inter** for dense, ultra-legible body copy.

### Hierarchical Usage
- **Display Giant / Giant Mobile:** Exclusively handles queue digits (`YOUR NUMBER`, desk ticket numbers). Must render in `brand-navy` with tight tracking to maximize optical recognition at a distance.
- **Headlines (XL, LG, MD):** Plus Jakarta Sans provides friendly authority across greetings (`"Welcome back, Jane"`), doctor department names, and modal sheets.
- **Body Scale (LG, MD, SM):** Inter provides high legibility for clinical instructions, triage updates, doctor bios, and support metadata.
- **Labels & Overlines:** Rendered in bold, slightly tracked Plus Jakarta Sans. Overlines are always transformed to uppercase (`UPCOMING`, `NOW SERVING`, `ESTIMATED WAIT`) to serve as immediate visual wayfinders.

## Layout & Spacing

The system is constructed around a strict **4px baseline / 8px component grid** to manage clinical data density while leaving breathing room on handheld screens.

### Spatial Rhythms
- **Screen Margins:** Fixed at `1rem` (16px) on mobile viewports, stepping up to `1.5rem` (24px) on tablets to maximize thumb navigation zones.
- **Component Padding:** Standard cards utilize `1rem` internal padding; compact summary metric tiles use `0.75rem`.
- **Form Vertical Rhythm:** Consecutive form fields follow a `1rem` stack gap (`space-md`), paired with a `1.5rem` (`space-lg`) gap before the terminal CTA.

### Layout Modules
- **Date Ribbon:** Single-row horizontal scroll with `0.5rem` (`space-sm`) gaps between date pills.
- **Time Chip Grid:** 3-column auto-flow grid on mobile devices with `0.5rem` gutters.
- **Bottom Navigation Dock:** Fixed 5-tab anchor bar (`56px` height) with absolute safe-area bottom insets to clear hardware home-indicators.

## Elevation & Depth

Visual hierarchy relies on **chromatic surface grouping and structural hairline borders** rather than deep, murky shadows. This maintains a clean, sterile clinical atmosphere and ensures readability in varying light conditions.

### Elevation Levels
- **Canvas Base (`Level 0`):** Neutral ground `#F8FAFC`. Zero elevation.
- **Contained Surface (`Level 1`):** Cards, bottom sheets, and patient list items sit on `#FFFFFF`, bounded by a crisp `1px` solid border in `#E2E8F0`. When depth is required, a soft ambient bloom is applied: `box-shadow: 0 1px 3px rgba(22, 38, 74, 0.04), 0 1px 2px rgba(22, 38, 74, 0.02)`.
- **Raised Focus (`Level 2`):** Active doctor booking cards and selected queue tiles apply: `box-shadow: 0 4px 6px -1px rgba(22, 38, 74, 0.07), 0 2px 4px -2px rgba(22, 38, 74, 0.05)`.
- **Modal / Floating Anchors (`Level 3`):** Sticky action bars (`Call Next Patient`), confirmation bottom sheets, and notification snackbars use: `box-shadow: 0 10px 15px -3px rgba(22, 38, 74, 0.1), 0 4px 6px -4px rgba(22, 38, 74, 0.05)`.

### Tonal Stratification
Tonal layering replaces elevation for rapid data scanning:
- Hospital status counters leverage soft blue fills (`#EBF1FF`) directly on white cards.
- "Now Serving" alerts use soft green fills (`#E6F4EC`) with high-contrast forest green text (`#1E7A46`) for zero-elevation legibility.

## Shapes

The design system implements a **Rounded (Level 2)** geometry balance, combining approachable rounded-corner structures with purposeful pill forms for status indicators.

### Shape Geometry Rules
- **Base Cards & Inputs:** Standardized to `0.75rem` (12px) corner radii (`rounded-lg`), softening clinical forms while preserving internal rectangular grid alignments.
- **Action Buttons:** Standardized to `0.75rem` (12px) for primary form CTAs, matching input curvature.
- **Badges, Filters & Status Tags:** Always use complete pill rounding (`9999px` / `rounded-full`). This distinct pill language immediately distinguishes state-based, interactive metadata from content cards.
- **Queue Progress Centerpiece:** Rendered as a pure geometric circle (`border-radius: 50%`) with an integrated structural inner border.
- **Avatars:** Circular thumbnails for clinical staff avatars; soft rounded squares (`0.5rem`) for clinic specialty icons.

## Components

### Buttons
- **Primary CTA (`#F27438`):** High-visibility orange fill with white bold text (`label-lg`), minimum height `48px` to guarantee touch-target compliance. Used exclusively for conversion milestones (`Log In`, `Confirm Booking`, `Call Next Patient`). Active state deepens to `#C1541A`.
- **Secondary Action (`#EBF1FF`):** Soft blue background with `#2752B7` bold text. Used for supplementary workflows (`Book Appointment`, `Reschedule`).
- **Destructive Button:** Borderless or soft red background with `#DC2626` text for `Cancel Appointment`.
- **Fixed Bottom Anchor:** Primary mobile actions must anchor to the viewport bottom inside a white container (`Level 3` elevation) with `1rem` horizontal padding.

### Status Pills & Badges
- **Size Scale:** Height `24px` (micro) to `32px` (filter chip), horizontal padding `8px` to `12px`.
- **Available / Open:** `#E6F4EC` background, `#1E7A46` text with prepended `✓` icon.
- **Active / Serving ("NOW"):** Solid `#2752B7` background, `#FFFFFF` text, `overline` typography.
- **Filter Pills:** Unselected state has white background, `#E2E8F0` border, `#64748B` text. Selected state has `#1E7A46` background, `#FFFFFF` text, zero border.

### Live Queue Centerpiece (Signature Component)
- **Structure:** Centered `180px × 180px` circular module on the Live Queue screen.
- **Styling:** Fills with `#EBF1FF`, surrounded by a solid `4px` ring in `#2752B7`.
- **Internal Typography:** 
  - Overline label at top: `"YOUR NUMBER"` in `#2752B7` (`overline`).
  - Giant counter in center: e.g., `"18"` in `#16264A` (`display-giant-mobile`).
  - Subtitle at bottom: `"3 ahead of you"` in `#64748B` (`body-sm`).

### Cards & Doctor Profiles
- **Container:** `#FFFFFF` background, `1px` border in `#E2E8F0`, `0.75rem` border radius, `1rem` internal padding.
- **Layout:** Horizontal flex row with a `48px` circular avatar or stethoscope placeholder on the left, doctor credentials and specialty metadata stacked vertically in the center, and a forward chevron or availability pill right-aligned.
- **Separators:** In multi-row patient lists, rows are divided by `1px` hairline rules in `#E2E8F0`.

### Form Fields & Inputs
- **Base Style:** Height `48px`, background `#FFFFFF`, border `1px` solid `#E2E8F0`, radius `0.75rem`, horizontal padding `1rem`.
- **Typography:** Value text in `#16264A` (`body-md`), placeholder in `#64748B`.
- **Focus State:** Border shifts to `#2752B7` with an ambient ring: `box-shadow: 0 0 0 3px rgba(39, 82, 183, 0.15)`.
- **Error State:** Border shifts to `#DC2626` with red caption text (`body-sm`) anchored `4px` below the field.

### Turn Alert Banners
- **Placement:** Persistent pinned card at the top of the viewport when patient queue position reaches zero.
- **Styling:** `#E6F4EC` fill, `1.5px` border in `#1E7A46`, with prominent `#16264A` text: *"It's your turn — please proceed to Room 4B"*. Accompanied by a bold green checkmark glyph.