import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'
import { COLORS, TYPOGRAPHY, COMPONENT_SIZES, SHADOWS } from './src/styles/tokens'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: COLORS,
      fontFamily: {
        sans: ['Inter', 'Lato', 'Open Sans', ...defaultTheme.fontFamily.sans],
      },
      spacing: {
        '72': '18rem',
      },
      fontSize: {
        xs: TYPOGRAPHY.sizes.xs,
        sm: TYPOGRAPHY.sizes.sm,
        base: TYPOGRAPHY.sizes.base,
        lg: TYPOGRAPHY.sizes.lg,
        xl: TYPOGRAPHY.sizes.xl,
        '2xl': TYPOGRAPHY.sizes['2xl'],
        '3xl': TYPOGRAPHY.sizes['3xl'],
      },
      fontWeight: {
        normal: TYPOGRAPHY.weights.regular,
        medium: TYPOGRAPHY.weights.medium,
        semibold: TYPOGRAPHY.weights.semibold,
        bold: TYPOGRAPHY.weights.bold,
      },
      height: {
        header: COMPONENT_SIZES.headerHeight,
        poster: COMPONENT_SIZES.posterHeight,
        'poster-sm': COMPONENT_SIZES.posterHeightSmall,
      },
      width: {
        sidebar: COMPONENT_SIZES.sidebarWidth,
      },
      maxWidth: {
        content: COMPONENT_SIZES.maxContentWidth,
      },
      boxShadow: SHADOWS,
    },
  },
  plugins: [],
}

export default config
