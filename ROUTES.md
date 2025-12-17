# Page Routes

| Route | Purpose | Auth Required? | Status |
|---|---|---|---|
| `/` | Home dashboard | No | ✅ Implemented |
| `/library` | Unified media library | No | ✅ Implemented |
| `/movies` | Movie library (filtered) | No | ✅ Routed to Library |
| `/tv` | TV shows library (filtered) | No | ✅ Routed to Library |
| `/music` | Music library (filtered) | No | ✅ Routed to Library |
| `/books` | Books & audiobooks (filtered) | No | ✅ Routed to Library |
| `/podcasts` | Podcasts directory (filtered) | No | ✅ Routed to Library |
| `/watch/:id` | Full-screen video/audio player | No (local), Yes (remote) | 🔄 Planned |
| `/book/:id` | Book reader or viewer | No | 🔄 Planned |
| `/detail/:id` | Media details, cast, reviews | No | 🔄 Planned |
| `/search` | Global & scoped search | No | 🔄 Planned |
| `/settings` | App preferences + adult toggle | Yes (admin features) | 🔄 Stub exists |
| `/account` | User profile, sync, 2FA | Yes | 🔄 Planned |
| `/import` | Local file/folder import wizard | Yes | 🔄 Planned |
| `/profile` | User profile switcher & manager | Yes | 🔄 Planned |

Current implemented routes live in [src/App.tsx](src/App.tsx).