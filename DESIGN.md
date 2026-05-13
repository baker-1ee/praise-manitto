# Design System — Purple Edition (passionfroot-inspired)

## 1. Visual Theme & Atmosphere

A clean, modern UI inspired by passionfroot.me, reinterpreted with a deep purple/violet identity. The background is a near-white lavender canvas (`#fdfaff`) with subtle floating gradient blobs that create a soft, luminous depth — replacing flat background colors with ambient radial glows. Cards are crisp white with barely-there borders and multi-layer shadows, floating above the lavender canvas. The typography uses Inter with aggressive negative letter-spacing at display sizes and a consistent four-weight system.

The purple accent (`#7c3aed`, Violet-600) is the sole saturated color in the UI chrome — used for CTAs, icons, active states, and interactive highlights. All other surfaces are white, near-white lavender, or muted purple-gray. This restraint makes the accent color feel deliberate and premium.

**Key Characteristics:**
- Inter with negative letter-spacing at display sizes (-2px at large sizes)
- Purple-lavender palette: background `#fdfaff`, accent `#7c3aed`
- Near-black text via `hsl(267 50% 10%)` — warm purple undertone
- Whisper borders: `1px solid hsl(263 50% 90%)` — barely-visible lavender dividers
- Multi-layer shadow stacks with sub-0.05 opacity
- Radial gradient blobs for ambient background depth (top-right + bottom-left)
- Pill badges (9999px) with violet-tinted backgrounds

## 2. Color Palette & Roles

### Primary
- **Background** (`#fdfaff` / `hsl(255 80% 99%)`): Near-white with a faint lavender tint. The purple undertone reads as "air" rather than color.
- **Foreground** (`hsl(267 50% 10%)`): Deep purple-black for primary text. Warmer and softer than pure black.
- **Primary Violet** (`#7c3aed` / `hsl(262 83% 58%)`): Main accent. CTAs, active states, icons, links.
- **Primary Violet Dark** (`#6d28d9`): Hover/active state of primary.

### Surface
- **Card** (`#ffffff`): Pure white card surfaces.
- **Secondary** (`#ede9fe` / `hsl(254 88% 96%)`): Violet-100. Tinted surface for hover states, secondary backgrounds.
- **Muted** (`hsl(250 60% 96%)`): Slightly more lavender than secondary. Section fills, subtle backgrounds.
- **Accent** (`hsl(254 88% 95%)`): Accent surface, badge backgrounds.

### Text
- **Foreground** (`hsl(267 50% 10%)`): Headlines, body copy.
- **Muted Foreground** (`hsl(265 18% 45%)`): Secondary text, descriptions, metadata.
- **Warm Gray 300** (`#9c95b8`): Placeholder text, disabled states, captions.
- **Warm Gray 500** (`#5b5080`): Medium-emphasis labels, icons.

### Borders & Depth
- **Border** (`hsl(263 50% 90%)`): Whisper-weight lavender border.
- **Input** (`hsl(263 35% 84%)`): Input field borders.
- **Ring** (`hsl(262 83% 58%)`): Focus ring.

### Decorative
- **Blob 1** (`rgba(139, 92, 246, 0.12)`): Soft violet glow, top-right area, 600px circle, blur-3xl.
- **Blob 2** (`rgba(167, 139, 250, 0.08)`): Lighter violet, bottom-left, 400px circle, blur-3xl.

### Semantic
- **Badge bg** (`#f0ebff`): Pill badge background.
- **Badge text** (`#7c3aed`): Pill badge text.
- **Destructive** (`hsl(0 84.2% 60.2%)`): Error states.

## 3. Typography Rules

### Font Family
- **Primary**: `Inter`, with fallbacks: `-apple-system, system-ui, Segoe UI, Helvetica, Arial`
- **OpenType Features**: `"lnum"` and `"locl"` enabled on display and heading text.

### Hierarchy

| Role | Size | Weight | Letter Spacing | Notes |
|------|------|--------|----------------|-------|
| Display Hero | 40–48px | 700 | -1.5 to -2px | Homepage greeting headlines |
| Section Heading | 26–32px | 700 | -1px | Card section titles |
| Sub-heading | 20px | 700 | -0.5px | Card headings, feature sub-sections |
| Body Large | 16px | 600 | -0.25px | Intro text, emphasized labels |
| Body | 14–16px | 400 | normal | Standard reading text |
| Nav / Button | 14px | 600 | normal | Navigation links, button text |
| Caption | 12–13px | 500 | normal | Metadata, secondary labels |
| Badge | 11–12px | 600 | 0.125px | Pill badges, status labels |

### Principles
- Large headings: aggressive negative letter-spacing (-1.5 to -2px at 40px+)
- Four-weight system: 400 (body), 500 (UI), 600 (emphasis), 700 (headings)
- Tight line-heights at display sizes (1.0–1.15), relaxed at body (1.5)

## 4. Component Stylings

### Buttons

**Primary Violet**
- Background: `#7c3aed`
- Text: `#ffffff`
- Radius: 10px
- Hover: `#6d28d9` with slight lift shadow
- Active: `scale(0.97)`

**Secondary**
- Background: `rgba(124, 58, 237, 0.07)`
- Text: `#7c3aed`
- Radius: 10px

**Ghost**
- Background: transparent
- Hover: `rgba(124, 58, 237, 0.06)`

### Cards & Containers
- Background: `#ffffff`
- Border: `1px solid hsl(263 50% 90%)`
- Radius: 16px (feature cards), 12px (standard)
- Shadow: multi-layer soft stack

### Badges / Pills
- Background: `#f0ebff`
- Text: `#7c3aed`
- Radius: 9999px
- Font: 12px weight 600, letter-spacing 0.125px

### Navigation
- Sticky top header, white background with whisper border
- Brand logo left-aligned with violet Heart icon
- Active link: violet text + violet-tinted bg pill
- Mobile: bottom tab bar

## 5. Decorative Background System

The page background uses floating radial gradient "blobs" fixed in the viewport to create ambient depth:

```
Blob 1: fixed top-[-128px] right-[-128px], 600×600px circle,
        bg: radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)
        filter: blur(64px)

Blob 2: fixed bottom-[-96px] left-[-96px], 400×400px circle,
        bg: radial-gradient(circle, rgba(167,139,250,0.08), transparent 70%)
        filter: blur(48px)
```

These are placed in the dashboard layout as `pointer-events-none` fixed elements, z-index below content.

## 6. Layout Principles

- **Base unit**: 8px
- **Max content width**: 896px (max-w-4xl)
- **Page padding**: 16px horizontal, 24px vertical top, 96px bottom (mobile tab bar)
- **Card spacing**: 16–20px gap between major sections
- **Border radius scale**: 8px (micro), 12px (standard card), 16px (feature card), 9999px (pill)

## 7. Quick Color Reference (Agent Prompt Guide)

| Role | Value |
|------|-------|
| Background | `#fdfaff` / `hsl(255 80% 99%)` |
| Foreground | `hsl(267 50% 10%)` |
| Primary CTA | `#7c3aed` |
| Primary hover | `#6d28d9` |
| Card bg | `#ffffff` |
| Secondary surface | `#ede9fe` |
| Muted surface | `hsl(250 60% 96%)` |
| Muted text | `hsl(265 18% 45%)` |
| Warm gray 500 | `#5b5080` |
| Warm gray 300 | `#9c95b8` |
| Border | `hsl(263 50% 90%)` |
| Badge bg | `#f0ebff` |
| Badge text | `#7c3aed` |

### Example Component Prompts
- "Create a primary button: `#7c3aed` background, white text, 10px radius, 10px 20px padding, Inter 14px weight 600. Hover: `#6d28d9`."
- "Design a card: white background, `1px solid hsl(263 50% 90%)` border, 16px radius. Multi-layer shadow: `rgba(124,58,237,0.04) 0px 4px 18px, rgba(124,58,237,0.03) 0px 2px 8px`."
- "Build a pill badge: `#f0ebff` background, `#7c3aed` text, 9999px radius, 4px 10px padding, 12px Inter weight 600."
