# 🧠 Reel Reader - Brand Guide

Reel Reader is a **bold, dark-themed media management app** with a **cinematic style**. This guide informs design decisions, component development, and tone for the application.

Use this as the **source of truth** for brand identity and tokens. For CSS implementation patterns see [style-guide.md](style-guide.md); for component inventory/status see [COMPONENTS.md](COMPONENTS.md); for quick token lookup see [THEMES.md](THEMES.md).

## 🌟 Brand Identity

**Mission**: Empower users to organize, discover, and enjoy all their media in one beautiful, intuitive place.

**Personality**: Modern, friendly, cinematic—like Netflix meets Plex with a personal touch.

**Visual Style**: Dark, flat, minimal with bold accent colors. No clutter, maximum content.

## 🌈 Color Palette

Primary Colors:
- **Dark**: `#08080A` — Main background, deep black
- **Primary**: `#1659B6` — Actions, buttons, focus states
- **Light**: `#FDF9F3` — Text, foreground content
- **Surface**: `#24164C` — Panels, cards, secondary containers
- **Highlight**: `#E1D50D` — Tags, badges, CTAs, emphasis

Usage:
- `bg-dark` for page backgrounds
- `bg-surface` for cards, modals, dropdowns
- `bg-primary` for primary buttons, links, hover states
- `bg-highlight` for tags, ratings badges, notifications
- `text-light` for all text on dark backgrounds

## 🅰 Typography

**Font Family**: Inter, Lato, Open Sans (fallback to sans-serif)

**Size Scale**:
- `text-xs` (12px) — Labels, small UI elements
- `text-sm` (14px) — Details, metadata on cards
- `text-base` (16px) — Body text, UI labels
- `text-lg` (18px) — Section titles
- `text-xl` (20px) — Page titles

**Font Weights**:
- Regular (400) — Body copy, descriptions
- Medium (500) — UI labels, interactive text
- Semibold (600) — Headings, emphasis
- Bold (700) — Not typically used; prefer semibold

## 🧱 Component Conventions

### Layout & Spacing

- **No rounded corners** — Use `rounded-none` consistently
- **Spacing scale**: `p-1` (4px) to `p-6` (24px)
- **Gaps**: Use `gap-3`, `gap-4` for grid/flex spacing
- **Hover elevation**: Add `hover:shadow-md` for interactivity

### Buttons

```tsx
// Primary (default action)
<button className="bg-primary text-white px-3 py-1 text-sm hover:bg-opacity-80">
  Watch Now
</button>

// Secondary (alternative action)
<button className="bg-surface text-light px-3 py-1 text-sm hover:bg-dark">
  Add to List
</button>

// Outline (low-priority action)
<button className="border border-light text-light px-3 py-1 text-sm hover:bg-white/10">
  More Options
</button>
```

### Cards

```tsx
<div className="bg-surface text-light rounded-none hover:shadow-md hover:scale-[1.02] transition">
  <img src="poster.jpg" className="w-full h-72 object-cover" />
  <div className="p-3">
    <h3 className="text-base font-semibold">Title</h3>
    <p className="text-sm text-gray-300">Subtitle or metadata</p>
  </div>
</div>
```

### Tags & Badges

```tsx
// Highlight (important/CTA)
<span className="bg-highlight text-dark text-xs font-medium px-2 py-0.5 uppercase">
  Top Pick
</span>

// Custom color (user-defined)
<span style={{ backgroundColor: userColor }} className="text-light text-xs font-medium px-2 py-0.5">
  Custom Tag
</span>
```

## 🌙 Dark Mode & Accessibility

- **Dark theme is default** — No light mode toggle unless explicitly requested
- **Contrast**: Ensure text meets WCAG AA (4.5:1 ratio minimum)
- **Icons**: Use outline style from Lucide or Heroicons
- **Interactions**: Provide visual feedback (hover, focus, active states)

## 🗣 Tone & Language

**Brand Voice**: Friendly, casual, conversational. Avoid jargon.

**Do:**
- "Watch Now"
- "Add to List"
- "What are you in the mood for?"
- "Got it"

**Don't:**
- "Submit"
- "Execute Playback"
- "Initialize Media Scan"
- Overly technical language

## 🧩 Icon Guidelines

Use **Lucide React** (outline icons):

| Purpose | Icon | Usage |
|---------|------|-------|
| Play | `PlayCircle` | Video/audio playback |
| Favorites | `Heart` | Watchlist, favorites |
| Menu | `Menu` | Navigation toggle |
| Search | `Search` | Search bar |
| Settings | `Settings` | Preferences |
| Notifications | `Bell` | Alerts, updates |
| Rating | `Star`, `Flame` | Ratings, popularity |
| More | `MoreVertical` | Dropdown menus |

## 📐 Layout Patterns

### Top Header
- Fixed position, full width
- Contains logo, search, user menu
- Dark background with light text

### Sidebar Navigation
- Collapsible on mobile
- Dark surface background
- Icons + labels for menu items
- Active state: `bg-primary`

### Content Grid
- Responsive columns (1-6 depending on screen)
- Cards with poster images
- Hover: slight lift, shadow
- Fixed height images with `object-cover`

### Modal/Overlay
- Dark background with opacity
- Surface-colored content area
- Dismissible via Escape or close button

## \ud83d\udcDD Updates & Maintenance

- Review brand guide quarterly
- Ensure consistency across all screens
- Test with actual users for feedback
- Collect component examples for new features
