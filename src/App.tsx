import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HeaderBar, SidebarMenu, MusicPlayerBar } from '@components/index'
import { Home } from '@pages/Home'
import { Library } from '@pages/Library'
import { Settings } from '@pages/Settings'
import { Detail } from '@pages/Detail'
import { Search } from '@pages/Search'
import { Import } from '@pages/Import'
import { Account } from '@pages/Account'
import { Watch } from '@pages/Watch'
import { Book } from '@pages/Book'
import { Profile } from '@pages/Profile'
import { Movies } from '@pages/Movies'
import { TVShows } from '@pages/TVShows'
import { Music } from '@pages/Music'
import { Books } from '@pages/Books'
import { Podcasts } from '@pages/Podcasts'
import { AdultMovies } from '@pages/AdultMovies'
import { AdultBooks } from '@pages/AdultBooks'
import { useProfileStore } from '@store/profileStore'
import { useProfileMediaStore } from '@store/profileMediaStore'
import { useLibraryStore } from '@store/libraryStore'
import { useUIStore } from '@store/index'
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

  return (
    <Router>
      <div className="bg-dark min-h-screen text-light">
        <HeaderBar />
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
            <Route path="/import" element={<Import />} />
            <Route path="/account" element={<Account />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/detail/:id" element={<Detail />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/book/:id" element={<Book />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
        <MusicPlayerBar />
      </div>
    </Router>
  )
}

export default App
