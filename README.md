# Reel Reader

Reel Reader is a bold, dark-themed media management application for organizing and enjoying local and streamed content — including movies, music, books, and adult content (with toggles).

## 🔧 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Desktop**: Electron or Tauri (preferred for performance)
- **Icons**: Lucide React
- **Routing**: React Router v6

## 📦 Features

- **Unified Library**: Organize movies, TV shows, music, books, podcasts, and photos in one place
- **Dark-Themed UI**: Cinematic, modern interface inspired by Plex and Netflix
- **Smart Filtering**: Filter by genre, language, rating, and more
- **Adult Content Toggle**: PIN-protected toggle for adult content visibility
- **Responsive Design**: Works on desktop and tablet screens
- **Plugin-Ready**: Extensible architecture for future plugins
- **DLNA/Chromecast Support**: Stream to other devices (planned)

## 🎨 Design

Built with a custom dark color palette:
- **Background**: `#08080A` (Dark)
- **Primary**: `#1659B6` (Blue)
- **Surface**: `#24164C` (Purple)
- **Text**: `#FDF9F3` (Light)
- **Highlight**: `#E1D50D` (Yellow)

## 🎯 Objectives

- Support local media and streaming metadata APIs
- Organize media types with rich metadata and artwork
- Support multiple users with custom profiles and restrictions
- Cross-device streaming, sync, and remote access
- Modular, extensible architecture with plugin support

## 🔮 Advanced Features

### Core
- Smart media library (multi-format)
- Adult content toggle with encryption
- Metadata fetch via API
- Watchlist, playlists, collections
- Optional features catalog: `OPTIONAL_FEATURES.md` (imported 1–200 feature catalog)

### Planned
- Watch parties and live chat
- Voice command integration (Google/Alexa)
- Goodreads and Trakt integration
- Remote file upload
- Mobile companion app
- Plugin marketplace

## 🚀 Getting Started

### Handoff / Env Setup
- Copy `.env.example` to `.env.local` and fill in your own keys (TMDB, OMDb, Last.fm, YouTube Data; optional Spotify, FANZA/DLsite/R18, CORS proxy). Do not ship your secrets in the binary.

- Spotify: Authorization Code + PKCE is supported — register redirect `http://127.0.0.1:5173/auth/spotify/callback` (or your prod URL) and set `VITE_SPOTIFY_REDIRECT_URI`.
  - Note: The app uses the Spotify Web Playback SDK only to register an in-browser device (the virtual "Reel Reader" device). Actual playback control is performed via the Spotify Web API (`/v1/me/player/*`).
  - Implementation details: PKCE verifier fallback (encoded in `state`) is used to recover the verifier across reloads; duplicate token-exchange is guarded to handle React Strict Mode; tokens are automatically refreshed when near expiry. Playlists can be expanded and individual tracks played from the Music page; a minimizable draggable `MiniPlayer` and persistent playback controls are included (see `src/pages/Music.tsx`, `src/components/MiniPlayer.tsx`, `src/services/spotifyPlayback.ts`).

- Desktop builds (Tauri/Electron): keep keys external (config file or first-run input). If you need to protect secrets, use a tiny backend/proxy and keep secrets server-side.
- Restart `npm run dev` after adding env values so Vite picks them up.

### Disk space note
- If `src-tauri/target` grows large, it contains Rust/Tauri build artifacts and can be safely deleted to reclaim disk space. It will be rebuilt automatically on the next `npm run dev` or `npm run build` that targets Tauri.

### Prerequisites
- Node.js 18+ and npm/yarn
- Tauri CLI (for desktop building)

### Installation

```bash
# Install dependencies
npm install
# or
yarn install
```

### Development

```bash
# Start development server
npm run dev
# or
yarn dev
```

The app will open in a development window at `http://localhost:5173`

### Building

```bash
# Build for production
npm run build
# or
yarn build
```

## 📁 Project Structure

```
reel-reader/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── MediaCard.tsx
│   │   ├── HeaderBar.tsx
│   │   ├── SidebarMenu.tsx
│   │   ├── Button.tsx
│   │   ├── TagChip.tsx
│   │   └── PlayerControls.tsx
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Library.tsx
│   │   └── Settings.tsx
│   ├── store/              # Zustand stores
│   │   ├── libraryStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tauri.conf.json
└── README.md
```

## 🧭 Routes

- `/` - Home dashboard
- `/library` - Main media library
- `/movies` - Movie library (filtered)
- `/tv` - TV shows library
- `/music` - Music library
- `/books` - Books library
- `/podcasts` - Podcasts library
- `/settings` - Application settings

## 🎯 Core Components

### MediaCard
Displays media poster with title, rating, language, and tags. Supports hover animations.

### HeaderBar
Top navigation bar with logo, search, notifications, and user menu.

### SidebarMenu
Navigation menu with media type filters. Responsive and collapsible on mobile.

### Button
Flexible button component with multiple variants (primary, secondary, outline) and sizes.

### TagChip
Genre/language badge with optional custom colors.

### PlayerControls
In-player UI with timeline, play/pause, volume, and fullscreen controls.

## 🔐 State Management

### LibraryStore (Zustand)
Manages:
- Media library data
- Filtering and search
- Favorite media
- Watch history and progress

### UIStore (Zustand)
Manages:
- Sidebar visibility
- Dark mode state
- Current page
- Selected media

## 📚 Documentation

Comprehensive guides for development and design:

- [COMPONENTS.md](COMPONENTS.md) — UI component specifications and conventions
- [ROUTES.md](ROUTES.md) — Page routes and authentication requirements
- [API_SPEC.md](API_SPEC.md) — Backend API contracts and examples
- [DB_SCHEMA.md](DB_SCHEMA.md) — Database models and structure
- [UX_FLOW.md](UX_FLOW.md) — User experience workflows
- [FEATURES.md](FEATURES.md) — Feature inventory (core and optional)
- [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) — Global state design with Zustand
- [AUTH_FLOW.md](AUTH_FLOW.md) — Authentication and access control
- [THEMES.md](THEMES.md) — Theme tokens and customization
- [MIDDLEWARE.md](MIDDLEWARE.md) — Backend guards and validation
- [TESTING.md](TESTING.md) — Testing strategy and tooling
- [ROADMAP.md](ROADMAP.md) — Development phases and milestones
- [brand-guide.md](brand-guide.md) — Brand voice and design principles
- [style-guide.md](style-guide.md) — Component styling and conventions

## 🧪 Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 🛠️ Feature Roadmap

### MVP (Phase 1)
- [x] Local media library (movies, TV, music, books)
- [x] Metadata API fetch (TMDb, MusicBrainz, OpenLibrary)
- [x] User profiles & basic restrictions
- [ ] DLNA/Chromecast playback
- [ ] Plugin-ready architecture
- [ ] Basic remote streaming
- [ ] Desktop app (Tauri)

### Beta (Phase 2)
- [ ] Watchlist, syncing, encryption
- [ ] Multi-profile + 2FA
- [ ] Advanced metadata cleanup (AI)
- [ ] Streaming integration (Netflix, Prime, etc.)

### Post-Launch (Phase 3)
- [ ] Mobile controller app
- [ ] Watch party system with chat
- [ ] Plugin marketplace
- [ ] VR browsing
- [ ] Calibre & Goodreads sync
- [ ] Live TV/DVR support
- [ ] Voice assistant integration

## 🛠️ Future Features

- [ ] Mobile companion app
- [ ] Watch parties with real-time chat
- [ ] AI-powered metadata cleanup
- [ ] Streaming integration (Netflix, Prime, etc.)
- [ ] Offline download capability
- [ ] Plugin marketplace
- [ ] Multi-device sync
- [ ] Voice assistant integration

## 📝 Documentation

- See `/brand-guide.md` for UI/UX guidelines
- See `/style-guide.md` for component styling standards
- See `/components.md` for component specifications

## 📄 License

Proprietary - All rights reserved

## 👥 Authors

Developed as part of the Reel Reader project.

---

**Happy streaming! 🎬📚🎵**
