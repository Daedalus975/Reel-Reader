# 🎨 Style Guide — Reel Reader

This document defines CSS patterns, Tailwind utilities, and styling best practices for consistent UI development.

Use this as the **implementation playbook**. Brand tokens and voice live in [brand-guide.md](brand-guide.md); component inventory/status is in [COMPONENTS.md](COMPONENTS.md); quick token reference is [THEMES.md](THEMES.md).

## 🌈 Color Usage in CSS

### Tailwind Config

```js
// tailwind.config.ts
theme.extend.colors = {
  dark: '#08080A',
  primary: '#1659B6',
  light: '#FDF9F3',
  surface: '#24164C',
  highlight: '#E1D50D',
}
```

### Utility Classes

| Purpose | Class(es) |
|---------|-----------|
| Background | `bg-dark`, `bg-surface`, `bg-primary` |
| Text | `text-light`, `text-gray-300`, `text-gray-400` |
| Hover | `hover:bg-primary/80`, `hover:bg-white/10`, `hover:shadow-md` |
| Focus | `focus:ring-1 focus:ring-primary` |
| Border | `border border-light`, `border border-surface` |

## 🧱 Component Patterns

### MediaCard

```html
<div class="bg-surface text-light rounded-none hover:shadow-md hover:scale-[1.02] transition">
  <img src="poster.jpg" class="w-full h-72 object-cover" alt="Movie Poster" />
  <div class="p-3 space-y-2">
    <!-- Title -->
    <h3 class="text-base font-semibold truncate">Movie Title</h3>
    
    <!-- Metadata -->
    <p class="text-sm text-gray-300">2024 • Drama</p>
    
    <!-- Rating & Language -->
    <div class="flex justify-between text-xs">
      <span class="bg-highlight text-dark px-2 py-0.5 font-semibold">⭐ 8.5</span>
      <span class="text-gray-400 uppercase">EN</span>
    </div>
    
    <!-- Tags -->
    <div class="flex flex-wrap gap-1">
      <span class="bg-highlight/20 text-highlight text-xs px-2 py-0.5">Tag 1</span>
      <span class="bg-highlight/20 text-highlight text-xs px-2 py-0.5">Tag 2</span>
    </div>
  </div>
</div>
```

### Buttons

```html
<!-- Primary Button -->
<button class="bg-primary text-white px-3 py-1 text-sm font-medium hover:bg-opacity-80 transition">
  Watch Now
</button>

<!-- Secondary Button -->
<button class="bg-surface text-light px-3 py-1 text-sm hover:bg-dark transition">
  Add to List
</button>

<!-- Outline Button -->
<button class="border border-light text-light px-3 py-1 text-sm hover:bg-white/10 transition">
  More Options
</button>
```

### HeaderBar

**Brand Logo**: Uses **Pacifico** cursive font with gradient (from-primary → highlight → accent) and BookOpen icon

```html
<header class="fixed top-0 left-0 right-0 bg-dark border-b border-surface h-16 z-40">
  <div class="h-full px-4 flex items-center justify-between">
    <!-- Logo with Icon and Gradient -->
    <a href="/" class="flex items-center gap-2 group">
      <BookOpen size={28} class="text-primary group-hover:text-highlight transition-colors" />
      <span 
        class="text-2xl font-bold bg-gradient-to-r from-primary via-highlight to-accent bg-clip-text text-transparent hover:scale-105 transition-transform"
        style="font-family: 'Pacifico', cursive"
      >
        Reel Reader
      </span>
    </a>
    
    <!-- Search -->
    <div class="flex-1 max-w-xs mx-4 hidden md:flex">
      <input 
        type="text" 
        placeholder="Search..." 
        class="w-full bg-surface text-light px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
    
    <!-- Actions -->
    <div class="flex items-center gap-2">
      <button class="p-2 hover:bg-surface rounded-none transition">
        <Icon size={20} class="text-light" />
      </button>
    </div>
  </div>
</header>
```

**Brand Font Requirements**:
- **Font**: Pacifico (Google Fonts)
- **Import**: `<link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet" />`
- **Gradient**: `bg-gradient-to-r from-primary via-highlight to-accent bg-clip-text text-transparent`
- **Icon**: BookOpen from lucide-react (size 28, primary color with hover highlight)
- **Typography**: text-2xl, font-bold, proper case "Reel Reader" (not all caps)

### Sidebar Navigation

```html
<nav class="fixed left-0 top-16 bottom-0 w-72 bg-surface border-r border-dark overflow-y-auto z-40">
  <div class="p-4 space-y-2">
    <a href="/" class="flex items-center gap-3 px-4 py-3 bg-primary text-light rounded-none transition">
      <Icon size={20} />
      <span class="font-medium">Home</span>
    </a>
    <a href="/library" class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-dark rounded-none transition">
      <Icon size={20} />
      <span class="font-medium">Library</span>
    </a>
  </div>
</nav>
```

### Tags & Labels

```html
<!-- Highlight Tag -->
<span class="bg-highlight text-dark text-xs font-medium px-2 py-0.5 uppercase">
  Action
</span>

<!-- Muted Tag -->
<span class="bg-surface text-gray-300 text-xs font-medium px-2 py-0.5">
  Watched
</span>

<!-- Custom Color Tag -->
<span style="background-color: #FF6B6B;" class="text-white text-xs font-medium px-2 py-0.5">
  Custom
</span>
```

## ✨ Interactions & Transitions

### Hover Effects

```html
<!-- Card Hover -->
<div class="transition duration-200 ease-in-out hover:shadow-md hover:scale-[1.02]">
  Content
</div>

<!-- Button Hover -->
<button class="transition-all duration-200 hover:bg-opacity-80">
  Action
</button>

<!-- Background Hover -->
<div class="transition bg-surface hover:bg-dark">
  Item
</div>
```

### Focus States

```html
<!-- Input Focus -->
<input class="focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark" />

<!-- Button Focus -->
<button class="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-dark">
  Click me
</button>
```

## 🔲 Spacing & Sizing

### Spacing Scale

```css
p-0  = 0
p-1  = 4px
p-2  = 8px
p-3  = 12px
p-4  = 16px
p-5  = 20px
p-6  = 24px
```

### Common Component Sizes

| Element | Padding | Height |
|---------|---------|--------|
| Button (sm) | `px-3 py-1` | auto |
| Button (md) | `px-4 py-2` | auto |
| Card | `p-3` | auto |
| MediaCard Image | — | `h-72` (288px) |
| Header | — | `h-16` (64px) |
| Sidebar | `w-72` (288px) | 100% |

## 🌙 Dark Mode Utilities

Even though dark mode is default, these utilities apply for light mode:

```html
<!-- Default dark, light mode override -->
<div class="bg-dark dark:bg-light text-light dark:text-dark">
  Content
</div>

<!-- Hover state -->
<div class="hover:bg-surface dark:hover:bg-gray-200">
  Hover me
</div>
```

## 📱 Responsive Design

```html
<!-- Hidden on small screens, shown on md+ -->
<div class="hidden md:block">
  Desktop only
</div>

<!-- Grid layout -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div class="bg-surface">Card 1</div>
  <div class="bg-surface">Card 2</div>
  <div class="bg-surface">Card 3</div>
  <div class="bg-surface">Card 4</div>
</div>
```

## ✅ QA Checklist

Before shipping a component:

- [ ] Contrast ratio meets WCAG AA (4.5:1 for text)
- [ ] Rounded corners are `rounded-none`
- [ ] Hover states use `hover:shadow-md` or opacity
- [ ] Text color is `text-light` on dark backgrounds
- [ ] Spacing uses standard Tailwind scale (p-3, gap-4, etc.)
- [ ] Responsive breakpoints work (mobile, tablet, desktop)
- [ ] Focus states are visible and clear
- [ ] Icons are from Lucide and size is consistent
- [ ] Brand colors are correct (dark, primary, highlight)
- [ ] No hardcoded colors; use Tailwind config

## 🔗 Related Documents

- [brand-guide.md](brand-guide.md) — Brand identity and tone
- [COMPONENTS.md](COMPONENTS.md) — Component specifications
- [THEMES.md](THEMES.md) — Theme customization and tokens
