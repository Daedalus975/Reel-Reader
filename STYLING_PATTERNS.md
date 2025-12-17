# 🎨 Styling Patterns — Implementation Guide

This document establishes styling conventions **before full design pass**. Use these patterns to ensure consistency when styling components later.

## 🎯 Philosophy

- **Token-driven**: All colors/sizing come from `src/styles/tokens.ts`
- **Component-scoped**: Styles stay within components; no global override rules
- **Unstyled → Styled**: Structure skeleton now, fill in design later
- **Consistency locked**: Same patterns everywhere = easy bulk styling updates

## 📐 Pattern Structure

Each component follows this structure:

```tsx
// src/components/ExampleComponent.tsx
import { COMPONENT_PRESETS, COLORS, SPACING } from '@/styles/tokens'
import { classNames } from '@/styles/tokens'

export const ExampleComponent = ({ isActive }: { isActive?: boolean }) => {
  return (
    <div className={classNames(COMPONENT_PRESETS.card, isActive && 'ring-2 ring-primary')}>
      <h3 className={COMPONENT_PRESETS.heading.h3}>Title</h3>
      <p className={COMPONENT_PRESETS.text.small}>Description</p>
    </div>
  )
}
```

## 🔧 When Styling Each Component

### MediaCard

**Current skeleton** → Should have:
- `bg-surface` background
- Poster image with `h-poster` (288px)
- Hover scale + shadow effect
- Tags with `bg-highlight` or muted variant
- Rating badge with `bg-highlight text-dark`

**Styling tasks**:
- [ ] Add hover animation (scale, shadow)
- [ ] Format metadata line (year • genre)
- [ ] Darken text on light hovers
- [ ] Add focus ring for keyboard nav

### Button Component

**Current structure** → Should have variants:
- Primary: `bg-primary text-white hover:bg-opacity-80`
- Secondary: `bg-surface text-light hover:bg-dark`
- Outline: `border border-light text-light hover:bg-white/10`

**Styling tasks**:
- [ ] Add size variants (sm, md, lg)
- [ ] Add disabled state (opacity-50, cursor-not-allowed)
- [ ] Add focus ring + states
- [ ] Test contrast on all backgrounds

### HeaderBar

**Current structure** → Should have:
- Fixed position, full width, `bg-dark`
- Logo in `text-highlight font-bold`
- Search input with `bg-surface focus:ring-primary`
- Icon buttons with hover states

**Styling tasks**:
- [ ] Add `border-b border-surface`
- [ ] Center vertical alignment
- [ ] Add responsive hide/show (sidebar toggle on mobile)
- [ ] Add active/hover states to user menu

### SidebarMenu

**Current structure** → Should have:
- Fixed position, `bg-surface`
- Menu items with active state (blue background)
- Hover effect on inactive items
- Icons from Lucide with consistent sizing

**Styling tasks**:
- [ ] Add `border-r border-dark`
- [ ] Highlight active route with `bg-primary`
- [ ] Add smooth transitions on hover
- [ ] Collapse state styling (mobile)

### TagChip

**Current structure** → Should have:
- Highlight style: `bg-highlight text-dark`
- Muted style: `bg-surface text-gray-300`
- Custom color support via inline style

**Styling tasks**:
- [ ] Add consistent padding
- [ ] Add truncate if text too long
- [ ] Hover state (slightly brighter)
- [ ] Remove button if provided

### PlayerControls

**Current structure** → Placeholder for video player UI

**Styling tasks**:
- [ ] Create control bar layout (play, timeline, volume, fullscreen)
- [ ] Add semi-transparent overlay on video
- [ ] Hover shows controls, auto-hides after delay
- [ ] Add focus rings to all buttons
- [ ] Timeline drag handle styling

## 📋 Component Styling Checklist

For each component, complete these when doing the full styling pass:

### Required for Every Component
- [ ] Import tokens: `import { COMPONENT_PRESETS, COLORS } from '@/styles/tokens'`
- [ ] Use `classNames()` helper for conditional classes
- [ ] All colors from `COLORS` (no hardcoded hex)
- [ ] All spacing from `SPACING` (no arbitrary sizes)
- [ ] All typography from `TYPOGRAPHY`
- [ ] Hover state defined
- [ ] Focus state for keyboard nav
- [ ] Dark mode tested (default)
- [ ] Pass TypeScript strict mode

### Testing Before Merge
- [ ] Visual pass on dark background
- [ ] Contrast check (WCAG AA minimum 4.5:1)
- [ ] Hover/focus states visible
- [ ] No broken layout on mobile/tablet
- [ ] No console warnings
- [ ] Component still functional

## 🎨 Color Usage Quick Reference

### When to Use Each Color

| Color | Use Case | Example |
|-------|----------|---------|
| `dark` (#08080A) | Page background, default bg | `bg-dark` for entire app |
| `surface` (#24164C) | Cards, panels, inputs | `bg-surface` for MediaCard |
| `primary` (#1659B6) | Buttons, focus, active states | `bg-primary` for primary button |
| `light` (#FDF9F3) | Text on dark, foreground | `text-light` for all body copy |
| `highlight` (#E1D50D) | Tags, badges, emphasis | `bg-highlight text-dark` for badge |
| `gray-300` | Secondary text | `text-gray-300` for metadata |
| `gray-400` | Tertiary text, placeholders | `text-gray-400` for small labels |

### Common Combinations

```tsx
// Dark background with light text
<div className="bg-dark text-light">

// Card surface
<div className="bg-surface text-light">

// Primary action
<button className="bg-primary text-white hover:bg-opacity-80">

// Tag/badge
<span className="bg-highlight text-dark font-medium">

// Muted/secondary
<span className="bg-surface text-gray-300">

// Hover state
<div className="hover:bg-primary/80 transition-colors">
```

## 🔄 Import Pattern

Use this import pattern in every styled component:

```tsx
import { COMPONENT_PRESETS, classNames, COLORS, SPACING } from '@/styles/tokens'

// Use presets
<button className={COMPONENT_PRESETS.button.primary}>
  Save
</button>

// Combine with conditional
<div className={classNames(COMPONENT_PRESETS.card, isSelected && 'ring-2 ring-primary')}>
  Content
</div>

// Direct token access for custom combos
<span style={{ backgroundColor: COLORS.highlight }} className="text-dark font-medium">
  Custom
</span>
```

## 📱 Responsive Patterns

When adding responsive styling, use Tailwind breakpoints:

```tsx
// Stack on mobile, row on tablet+
<div className="flex flex-col md:flex-row gap-4">

// Hide on mobile, show on desktop
<div className="hidden lg:block">

// Different padding by size
<div className="p-2 md:p-4 lg:p-6">
```

Breakpoints from tokens:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## ✨ Animation/Transition Patterns

### Card Hover

```tsx
<div className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
```

### Button Hover

```tsx
<button className="transition-all duration-200 hover:bg-opacity-80">
```

### Background Transition

```tsx
<div className="transition-colors duration-200 bg-surface hover:bg-dark">
```

### Focus Ring

```tsx
<input className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark" />
```

## 🚀 Bulk Styling Updates

When the full design pass happens, updates are simple:

1. Edit token values in `src/styles/tokens.ts`
2. Tailwind rebuilds automatically
3. **All components update instantly** ✅

Example:
```ts
// src/styles/tokens.ts
export const COLORS = {
  primary: '#FF0000', // Changed from #1659B6
  // ... rest stays same
}
// Every component using bg-primary immediately turns red!
```

## 📝 Next Steps

1. Use these patterns when styling components
2. Always import from `src/styles/tokens.ts`
3. Keep component styles scoped (no global CSS)
4. Test each component against brand guide
5. Document any deviations or new patterns discovered
6. Keep this file updated as patterns emerge
