/**
 * Design Tokens for Reel Reader
 * Source: brand-guide.md
 * 
 * These tokens define all colors, typography, spacing, and component patterns.
 * Update these values and all styling stays consistent across the app.
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const COLORS = {
  // Primary Colors
  dark: '#08080A',        // Main background, deep black
  primary: '#1659B6',     // Actions, buttons, focus states
  light: '#FDF9F3',       // Text, foreground content
  surface: '#24164C',     // Panels, cards, secondary containers
  highlight: '#E1D50D',   // Tags, badges, CTAs, emphasis

  // Secondary Colors (derived)
  gray: {
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
  },

  // States
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  fontFamily: {
    base: "'Inter', 'Lato', 'Open Sans', sans-serif",
    heading: "'Inter', 'Lato', sans-serif",
  },
  
  sizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },

  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const

// ============================================================================
// SPACING & SIZING
// ============================================================================

export const SPACING = {
  // Padding/margin scale (in pixels)
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
} as const

export const COMPONENT_SIZES = {
  // Layout
  headerHeight: '64px',    // h-16
  sidebarWidth: '288px',   // w-72
  maxContentWidth: '1440px',

  // MediaCard
  posterHeight: '288px',   // h-72
  posterHeightSmall: '240px',

  // Icons
  iconSmall: '16px',
  iconBase: '20px',
  iconLarge: '24px',

  // Buttons
  button: {
    sm: { px: '12px', py: '4px' },
    md: { px: '16px', py: '8px' },
    lg: { px: '20px', py: '12px' },
  },
} as const

// ============================================================================
// SHADOWS & EFFECTS
// ============================================================================

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const

export const TRANSITIONS = {
  fast: 'all 0.15s ease-in-out',
  base: 'all 0.2s ease-in-out',
  slow: 'all 0.3s ease-in-out',
} as const

// ============================================================================
// COMPONENT PRESETS (CSS CLASSES)
// ============================================================================

/**
 * Pre-built className patterns for consistency.
 * Use these as templates or combine with dynamic classes.
 */
export const COMPONENT_PRESETS = {
  // Buttons
  button: {
    primary: 'bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-opacity-80 transition-all duration-200',
    secondary: 'bg-surface text-light px-4 py-2 text-sm hover:bg-dark transition-all duration-200',
    outline: 'border border-light text-light px-4 py-2 text-sm hover:bg-white/10 transition-all duration-200',
  },

  // Cards
  card: 'bg-surface text-light rounded-none hover:shadow-md hover:scale-[1.02] transition-all duration-200',
  cardInner: 'p-3 space-y-2',

  // Tags/Badges
  badge: {
    highlight: 'bg-highlight text-dark text-xs font-medium px-2 py-0.5 uppercase',
    muted: 'bg-surface text-gray-300 text-xs font-medium px-2 py-0.5',
  },

  // Inputs
  input: 'bg-surface text-light px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200',

  // Text
  heading: {
    h1: 'text-3xl font-bold text-light',
    h2: 'text-2xl font-semibold text-light',
    h3: 'text-lg font-semibold text-light',
  },

  text: {
    body: 'text-base text-light',
    small: 'text-sm text-gray-300',
    xs: 'text-xs text-gray-400',
  },

  // Layout
  container: 'bg-dark text-light min-h-screen',
  flexCenter: 'flex items-center justify-center',
  gridAuto: 'grid auto-cols-max gap-4',
} as const

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a color with opacity modifier
 * @example getColorWithOpacity('primary', 0.8) → 'rgba(22, 89, 182, 0.8)'
 */
export function getColorWithOpacity(colorKey: string, opacity: number): string {
  const colorValue = (COLORS as Record<string, unknown>)[colorKey]
  const color = typeof colorValue === 'string' ? colorValue : '#1659B6'
  // Convert hex to RGB
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Combine multiple className strings safely
 * @example classNames('bg-dark', isActive && 'bg-primary') → 'bg-dark bg-primary' or 'bg-dark'
 */
export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter((c) => typeof c === 'string').join(' ')
}

/**
 * Aggregate all tokens for convenience
 */
export const TOKENS = {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  COMPONENT_SIZES,
  SHADOWS,
  TRANSITIONS,
  COMPONENT_PRESETS,
}
