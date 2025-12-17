# Component Map – Reel Reader

This document lists the UI components, their purposes, and current implementation status.

Use this as the **inventory and status** source. Visual tokens and voice are defined in [brand-guide.md](brand-guide.md); CSS patterns and code examples live in [style-guide.md](style-guide.md); quick token lookup sits in [THEMES.md](THEMES.md).

| Component | Purpose | Notes |
|---|---|---|
| MediaCard | Displays poster, rating, language, tags | Implemented at [src/components/MediaCard.tsx](src/components/MediaCard.tsx) |
| PlayerControls | In-player UI with timeline & settings | Implemented at [src/components/PlayerControls.tsx](src/components/PlayerControls.tsx) |
| TagChip | Genre/language badge with custom color | Implemented at [src/components/TagChip.tsx](src/components/TagChip.tsx) |
| SidebarMenu | Navigation links and sections | Implemented at [src/components/SidebarMenu.tsx](src/components/SidebarMenu.tsx) |
| HeaderBar | Top bar with search and nav | Implemented at [src/components/HeaderBar.tsx](src/components/HeaderBar.tsx) |
| WatchlistPanel | View/edit saved content | Planned — not yet implemented |

Design conventions
- Square corners (`rounded-none`), flat surfaces
- Elevation only on hover (e.g., `hover:shadow-md`)
- Compact typography (`text-sm`, `text-xs`) with Inter/Lato/Open Sans
- Dark theme palette from [tailwind.config.ts](tailwind.config.ts)

## 🌈 Color Palette

```js
theme.extend.colors = {
  dark: '#08080A',       // Background base
  primary: '#1659B6',    // Accent / action
  light: '#FDF9F3',      // Light text / surfaces
  surface: '#24164C',    // Cards, panels
  highlight: '#E1D50D',  // Tags, ratings, accents
}
```

## 🅰 Typography

```js
theme.extend.fontFamily = {
  sans: ['Inter', 'Lato', 'Open Sans', 'sans-serif'],
};
```

- `text-xs`: Labels, small UI text
- `text-sm`: Details, body text on cards
- `text-base`: Body text, UI labels
- `text-lg` / `text-xl`: Titles, headings

## 🎨 Component Examples

### MediaCard Pattern
```tsx
<div className="bg-surface text-light rounded-none hover:shadow-md hover:scale-[1.02] transition">
  <img className="h-72 w-full object-cover" src="cover.jpg" />
  <div className="p-3">
    <h3 className="text-base font-semibold truncate">Title</h3>
    <p className="text-sm text-gray-300">Year • Genre</p>
    <div className="flex justify-between text-xs">
      <span className="bg-highlight text-dark px-2 py-0.5 font-semibold">⭐ 8.5</span>
      <span className="text-gray-400 uppercase">EN</span>
    </div>
  </div>
</div>
```

### Button Variants
```tsx
<!-- Primary -->
<button className="bg-primary text-white text-sm font-medium px-3 py-1 hover:bg-opacity-80">
  Watch Now
</button>

<!-- Secondary -->
<button className="bg-surface text-light text-sm px-3 py-1.5 hover:bg-dark">
  Add to List
</button>

<!-- Outline -->
<button className="border border-light text-light text-sm px-3 py-1 hover:bg-white/10">
  + My List
</button>
```

### Tag/Badge Pattern
```tsx
<span className="bg-highlight text-dark text-xs font-medium px-2 py-0.5 uppercase">
  Comedy
</span>
```

User-defined tag colors use inline styles:
```tsx
<span style={{ backgroundColor: customColor }} className="text-light text-xs font-medium px-2 py-0.5">
  Custom Tag
</span>
```

## 🌙 Dark Mode & Theming

- Dark mode is default (always-on)
- Light mode optional via `dark:` Tailwind variants
- Custom user themes supported via CSS variables
- Tag colors stored in database per user

## 🧩 Icons

Use Lucide React (outline style):
- `PlayCircle` — play action
- `ListMusic` — queue/playlist
- `InfoIcon` — details
- `Star`, `Flame` — ratings
- `Menu`, `Search`, `Bell` — navigation

## 🗣 Brand Voice

**Tone**: Friendly, casual, conversational

Good examples:
- "Watch Now"
- "Add to List"
- "Got it"

Avoid:
- "Submit"
- "Execute Playback"
- Overly technical language

## ✅ Guidelines for Implementation

- Keep components small and composable
- Prefer `rounded-none` for all containers
- Use hover for interactivity feedback only
- Group related UI into logical sections
- Ensure text has sufficient contrast (WCAG AA)
- Test responsive behavior on tablet/mobile
