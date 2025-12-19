import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HeaderBar, SidebarMenu, MusicPlayerBar, FoldoutPlayer, NotificationToastContainer } from '@components/index'
import { WebDesktopBanner } from './components/WebDesktopBanner'
import { Home } from '@pages/Home'
import { Library } from '@pages/Library'
import { Settings } from '@pages/Settings'
import { Detail } from '@pages/Detail'
import { Search } from '@pages/Search'
import { Account } from '@pages/Account'
import { Watch } from '@pages/Watch'
import { Book } from '@pages/Book'
import { Profile } from '@pages/Profile'
import { Movies } from '@pages/Movies'
import { TVShows } from '@pages/TVShows'
import { Music } from '@pages/Music'
import { Books } from '@pages/Books'
import { SpotifyCallback } from '@pages/SpotifyCallback'
import { Podcasts } from '@pages/Podcasts'
import { AdultMovies } from '@pages/AdultMovies'
import { AdultBooks } from '@pages/AdultBooks'
import { ErrorLog } from '@pages/ErrorLog'
import { Downloads } from '@pages/Downloads'
import { Collections } from '@pages/Collections'
import { CollectionView } from './pages/CollectionView'
import { Social } from '@pages/Social'
import { CloudSync } from '@pages/CloudSync'
import { Plugins } from '@pages/Plugins'
import { CustomizeMedia } from '@pages/CustomizeMedia'
import { LibrarySettings } from '@pages/LibrarySettings'
import { useProfileStore } from '@store/profileStore'
import { useProfileMediaStore } from '@store/profileMediaStore'
import { useLibraryStore } from '@store/libraryStore'
import { useUIStore } from '@store/index'
import { useMusicPlayerStore } from '@/store/musicPlayerStore'
import { initializeHotkeys, cleanupHotkeys } from '@/services/globalHotkeys'
import { isFeatureEnabled } from '@/utils/featureFlags'
import { metadataService } from './features/metadata'
import { buildProviderContext } from './features/metadata/integration'
import './index.css'

function App() {
  const currentProfileId = useProfileStore((state) => state.currentProfileId)
  const mediaByProfile = useProfileMediaStore((state) => state.mediaByProfile)
  const setMedia = useLibraryStore((state) => state.setMedia)
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)

  // Sync library store when profile changes
  useEffect(() => {
    const profileMedia = mediaByProfile[currentProfileId] || []
    setMedia(profileMedia)
  }, [currentProfileId, mediaByProfile, setMedia])

  // Initialize metadata service
  useEffect(() => {
    const initMetadata = async () => {
      const profile = useProfileStore.getState().profiles.find(p => p.id === currentProfileId)
      if (!profile) return

      try {
        const context = buildProviderContext(
          useProfileStore.getState(),
          { tmdbApiKey: localStorage.getItem('tmdb_api_key') ?? undefined }
        )

        await metadataService.initialize(context)
        console.log('[App] Metadata service initialized')
        
        // Expose context for testing in browser console (dev only)
        if (typeof window !== 'undefined') {
          (window as any).__metadataContext = context
        }
      } catch (error) {
        console.error('[App] Failed to initialize metadata service:', error)
      }
    }

    if (currentProfileId) {
      initMetadata()
    }

    return () => {
      metadataService.shutdown()
    }
  }, [currentProfileId])

  // Initialize global hotkeys
  useEffect(() => {
    if (!isFeatureEnabled('feature_global_hotkeys')) {
      return
    }

    const handleHotkeyAction = (action: string) => {
      const musicStore = useMusicPlayerStore.getState()
      
      switch (action) {
        case 'play-pause':
          musicStore.setIsPlaying(!musicStore.isPlaying)
          break
        case 'next':
          musicStore.playNext()
          break
        case 'previous':
          musicStore.playPrevious()
          break
        case 'stop':
          musicStore.setIsPlaying(false)
          break
        case 'volume-up':
          musicStore.setVolume(Math.min(1, musicStore.volume + 0.1))
          break
        case 'volume-down':
          musicStore.setVolume(Math.max(0, musicStore.volume - 0.1))
          break
        case 'mute':
          musicStore.setVolume(musicStore.volume > 0 ? 0 : 0.8)
          break
      }
    }

    initializeHotkeys(handleHotkeyAction as any)

    return () => {
      cleanupHotkeys()
    }
  }, [])

  // Enforce adult content segregation across profiles (move adult items to adult profile)
  useEffect(() => {
    const profileStore = useProfileStore.getState()
    const mediaStore = useProfileMediaStore.getState()
    const profiles = profileStore.profiles
    const adultProfile = profiles.find((p) => p.adultContentEnabled) || profileStore.createProfile('Adult', undefined, true)
    // For every non-adult profile, move adult items to adult profile
    profiles.forEach((p) => {
      if (!p.adultContentEnabled) {
        const list = mediaStore.getMediaForProfile(p.id)
        const adults = list.filter((m) => m.isAdult)
        if (adults.length) {
          adults.forEach((m) => {
            mediaStore.removeMediaFromProfile(p.id, m.id)
            mediaStore.addMediaToProfile(adultProfile.id, m)
          })
        }
      }
    })
  }, [currentProfileId])

  // Disable default right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Allow context menu only on inputs, textareas, and our custom context menus
      if (
        !target.closest('input') && 
        !target.closest('textarea') && 
        !target.closest('[data-allow-context]') &&
        !target.matches('[contenteditable="true"]')
      ) {
        e.preventDefault()
      }
    }
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  return (
    <Router>
      <div className="bg-dark min-h-screen text-light" onContextMenu={(e) => e.preventDefault()}>
        <HeaderBar />
      <WebDesktopBanner />
        <SidebarMenu />
        <div
          className="transition-all duration-300 ease-in-out"
          style={{
            marginLeft: sidebarOpen ? '288px' : '0',
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv" element={<TVShows />} />
            <Route path="/music" element={<Music />} />
            <Route path="/books" element={<Books />} />
            <Route path="/podcasts" element={<Podcasts />} />
            <Route path="/adult/movies" element={<AdultMovies />} />
            <Route path="/adult/books" element={<AdultBooks />} />
            <Route path="/search" element={<Search />} />
            <Route path="/account" element={<Account />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/detail/:id" element={<Detail />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/book/:id" element={<Book />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/library-settings/:type" element={<LibrarySettings />} />
            <Route path="/error-log" element={<ErrorLog />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collection/:id" element={<CollectionView />} />
            <Route path="/social" element={<Social />} />
            <Route path="/cloud-sync" element={<CloudSync />} />
            <Route path="/plugins" element={<Plugins />} />
            <Route path="/customize" element={<CustomizeMedia />} />
            <Route path="/auth/spotify/callback" element={<SpotifyCallback />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
        <MusicPlayerBar />
        <FoldoutPlayer />
        <NotificationToastContainer />
      </div>
    </Router>
  )
}

export default App
