import React, { useCallback, useState } from 'react'
import { MediaTypePage } from './MediaTypePage'
import { MusicVideoPlaylistBuilder, MusicVideoPlayer, MusicDetailModal } from '@components/index'
import { SpotifySearch } from '@components/SpotifySearch'
import { useMusicPlayerStore } from '@store/musicPlayerStore'
import { useLibraryStore } from '@store/libraryStore'
import { useSpotifyStore } from '@store/spotifyStore'
import { useSpotifyPlaybackStore } from '@/store/spotifyPlaybackStore'
import { isSpotifyConnected } from '@/services/spotify'
import { searchYouTubeVideo } from '@/services/youtube'
import type { Media } from '../types'
import type { SpotifyTrack } from '@/services/spotifyFeatures'
import { ChevronDown, ChevronUp, Music2, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react'
import DeviceSelector from '@components/DeviceSelector'

export const Music: React.FC = () => {
  const playQueue = useMusicPlayerStore((state) => state.playQueue)
  const setIsPlaying = useMusicPlayerStore((state) => state.setIsPlaying)
  const musicItems = useLibraryStore((state) => state.media.filter((m) => m.type === 'music' && !m.isAdult))
  const addMedia = useLibraryStore((state) => state.addMedia)
  const playPlaylist = useSpotifyPlaybackStore((s) => s.playPlaylist)
  const [selectedMusic, setSelectedMusic] = useState<Media | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showSpotifySearch, setShowSpotifySearch] = useState(false)
  const [showSpotifyPlaylists, setShowSpotifyPlaylists] = useState(false)
  
  // Spotify store
  const spotifyPlaylists = useSpotifyStore((s) => s.playlists)
  const spotifyPlaylistTracks = useSpotifyStore((s) => s.playlistTracks)
  const fetchPlaylistTracks = useSpotifyStore((s) => s.fetchPlaylistTracks)
  const spotifyConnected = isSpotifyConnected()
  const { isPlaying, currentTrack, togglePlay, nextTrack: spotifyNext, previousTrack: spotifyPrev } = useSpotifyPlaybackStore((s) => ({
    isPlaying: s.isPlaying,
    currentTrack: s.currentTrack,
    togglePlay: s.togglePlay,
    nextTrack: s.nextTrack,
    previousTrack: s.previousTrack,
  }))

  const handleCardClick = useCallback((media: Media) => {
    setSelectedMusic(media)
    setShowDetail(true)
  }, [])

  const handlePlayFromDetail = useCallback(() => {
    if (!selectedMusic) return
    const queue = musicItems.map((m) => m.id)
    playQueue(queue, selectedMusic.id)
    setIsPlaying(true)
    setShowDetail(false)
  }, [selectedMusic, musicItems, playQueue, setIsPlaying])

  const handleSelectSpotifyTrack = useCallback(async (track: SpotifyTrack) => {
    const now = new Date()
    let trailerUrl: string | undefined
    try {
      const ytQuery = `${track.artists.join(' ')} ${track.name} official music video`
      const yt = await searchYouTubeVideo(ytQuery)
      if (yt) trailerUrl = yt
    } catch {}

    addMedia({
      id: `${now.getTime()}`,
      title: track.name,
      type: 'music',
      year: undefined,
      genres: [],
      language: 'EN',
      rating: undefined,
      poster: track.imageUrl,
      backdrop: undefined,
      description: track.artists.join(', '),
      artist: track.artists[0],
      album: track.album,
      trailerUrl,
      previewUrl: undefined,
      spotifyTrackId: track.id,
      isAdult: false,
      tags: track.artists.slice(0, 3),
      watched: false,
      isFavorite: false,
      dateAdded: now,
      duration: track.duration_ms ? Math.floor(track.duration_ms / 1000) : undefined,
    })
  }, [addMedia])

  return (
    <>
      <MediaTypePage
        type="music"
        title="Music"
        pagePath="/music"
        onItemClick={handleCardClick}
      />

      {/* Spotify Integration Section */}
      {spotifyConnected && (
        <section className="px-6 md:px-10 lg:px-16 pb-8 space-y-6">
          {/* Spotify Search */}
          <div className="bg-surface rounded-none p-1">
            <button
              onClick={() => setShowSpotifySearch(!showSpotifySearch)}
              className="w-full flex items-center justify-between px-4 py-3 text-light hover:bg-dark/50 rounded-none"
            >
              <div className="flex items-center gap-2">
                <Music2 size={20} className="text-green-400" />
                <span className="font-semibold">Search Spotify</span>
              </div>
              {showSpotifySearch ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showSpotifySearch && (
              <div className="px-4 pb-4">
                <SpotifySearch onSelectTrack={handleSelectSpotifyTrack} />
              </div>
            )}
          </div>

          {/* Spotify Playlists */}
          {spotifyPlaylists.length > 0 && (
            <div className="bg-surface rounded-none p-1">
              {/* Minimal Spotify Player Controls */}
              <div className="px-4 py-3 border-b border-dark/30">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentTrack?.albumArt ? (
                    <img src={currentTrack.albumArt} alt={currentTrack.name} className="w-10 h-10 object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-surface flex items-center justify-center">
                      <Music2 size={18} />
                    </div>
                  )}
                  <div className="text-sm">
                    <div className="font-medium text-light">{currentTrack?.name || 'Not playing'}</div>
                    <div className="text-xs text-gray-400">{currentTrack?.artist || ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DeviceSelector />
                  <button onClick={() => useSpotifyPlaybackStore.getState().setShuffle(true)} className="p-2 bg-surface rounded-none" title="Shuffle">
                    <Shuffle size={16} />
                  </button>
                  <button onClick={() => useSpotifyPlaybackStore.getState().setRepeat('context')} className="p-2 bg-surface rounded-none" title="Repeat">
                    <Repeat size={16} />
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={spotifyPrev} className="p-2 bg-surface rounded-none">
                      <SkipBack size={18} />
                    </button>
                    <button onClick={togglePlay} className="p-2 bg-primary text-white rounded-none">
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button onClick={spotifyNext} className="p-2 bg-surface rounded-none">
                      <SkipForward size={18} />
                    </button>
                  </div>
                </div>
                </div>
                {currentTrack && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-xs text-gray-400 w-12 text-right">{Math.floor((currentTrack.progress || 0) / 1000 / 60)}:{String(Math.floor((currentTrack.progress || 0) / 1000) % 60).padStart(2, '0')}</div>
                    <input
                      type="range"
                      min={0}
                      max={currentTrack.duration || 0}
                      step={1000}
                      value={Math.min(currentTrack.progress || 0, currentTrack.duration || 0)}
                      onChange={(e) => useSpotifyPlaybackStore.getState().seek(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <div className="text-xs text-gray-400 w-12">{Math.floor((currentTrack.duration || 0) / 1000 / 60)}:{String(Math.floor((currentTrack.duration || 0) / 1000) % 60).padStart(2, '0')}</div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowSpotifyPlaylists(!showSpotifyPlaylists)}
                className="w-full flex items-center justify-between px-4 py-3 text-light hover:bg-dark/50 rounded-none"
              >
                <div className="flex items-center gap-2">
                  <Music2 size={20} className="text-green-400" />
                  <span className="font-semibold">My Spotify Playlists ({spotifyPlaylists.length})</span>
                </div>
                {showSpotifyPlaylists ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {showSpotifyPlaylists && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {spotifyPlaylists.map((playlist) => (
                      <div key={playlist.id} className="bg-dark p-3 rounded-none group">
                        <div
                          className="cursor-pointer relative hover:bg-dark/80"
                          onClick={async () => {
                            if (!spotifyPlaylistTracks[playlist.id]) {
                              await fetchPlaylistTracks(playlist.id)
                            }
                          }}
                        >
                          {playlist.imageUrl ? (
                            <img src={playlist.imageUrl} alt={playlist.name} className="w-full aspect-square object-cover rounded-none mb-2" />
                          ) : (
                            <div className="w-full aspect-square bg-surface flex items-center justify-center mb-2">
                              <Music2 size={32} className="text-gray-600" />
                            </div>
                          )}
                          <p className="text-light text-sm font-semibold truncate">{playlist.name}</p>
                          <p className="text-xs text-gray-400">{playlist.trackCount} tracks</p>

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-none flex items-center justify-center">
                            <Play size={40} className="text-highlight fill-highlight" />
                          </div>
                        </div>
                        {spotifyPlaylistTracks[playlist.id] && (
                          <div className="mt-2 text-sm text-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-gray-400">Showing {spotifyPlaylistTracks[playlist.id].length} tracks</div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => playPlaylist(playlist.uri)}
                                  className="px-3 py-1 bg-primary text-white text-xs rounded-none"
                                >
                                  Play All
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {spotifyPlaylistTracks[playlist.id].map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-1 hover:bg-dark/70 rounded-none">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-surface flex items-center justify-center text-xs overflow-hidden">
                                      {t.imageUrl ? <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" /> : <Music2 size={14} />}
                                    </div>
                                    <div className="text-sm">
                                      <div className="font-medium text-light">{t.name}</div>
                                      <div className="text-xs text-gray-400">{t.artists.join(', ')}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => useSpotifyPlaybackStore.getState().playTrack(t.uri)}
                                      className="px-2 py-1 bg-surface text-xs rounded-none"
                                    >
                                      Play
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="px-6 md:px-10 lg:px-16 pb-16 space-y-4">
        <MusicVideoPlaylistBuilder items={musicItems} />
        <MusicVideoPlayer />
      </section>

      {/* Music Detail Modal */}
      {selectedMusic && (
        <MusicDetailModal
          music={selectedMusic}
          isOpen={showDetail}
          onClose={() => {
            setShowDetail(false)
            setSelectedMusic(null)
          }}
          onPlay={handlePlayFromDetail}
        />
      )}
    </>
  )
}
