import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Music2 } from 'lucide-react'
import { Howl } from 'howler'
import { useLibraryStore } from '@store/libraryStore'
import { useMusicPlayerStore } from '@store/musicPlayerStore'
import { useSpotifyPlaybackStore } from '@/store/spotifyPlaybackStore'
import { useAudioSettingsStore } from '@/store/audioSettingsStore'

function toFileUrl(path?: string) {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.replace(/\\/g, '/').replace(/^\//, '')
  return `file:///${normalized}`
}

function isYouTube(url?: string) {
  if (!url) return false
  return /youtube\.com|youtu\.be/.test(url)
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export const MusicPlayerBar: React.FC = () => {
  const { media, markAsWatched } = useLibraryStore()
  const {
    queue,
    currentIndex,
    isPlaying,
    volume,
    playNext,
    playPrevious,
    setIsPlaying,
    setVolume,
    clear,
  } = useMusicPlayerStore()

  const audioSettings = useAudioSettingsStore()
  const currentHowlRef = useRef<Howl | null>(null)
  const nextHowlRef = useRef<Howl | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const updateIntervalRef = useRef<number>()
  const crossfadeInProgressRef = useRef(false)

  // Spotify playback overrides local audio when active
  const spotifyCurrent = useSpotifyPlaybackStore((s) => s.currentTrack)
  const spotifyPlaying = useSpotifyPlaybackStore((s) => s.isPlaying)
  const spotifySeek = useSpotifyPlaybackStore((s) => s.seek)
  const spotifyToggle = useSpotifyPlaybackStore((s) => s.togglePlay)
  const spotifyNext = useSpotifyPlaybackStore((s) => s.nextTrack)
  const spotifyPrev = useSpotifyPlaybackStore((s) => s.previousTrack)

  const currentId = queue[currentIndex]
  const currentMedia = useMemo(() => media.find((m) => m.id === currentId), [media, currentId])

  const sourceUrl = useMemo(() => {
    if (!currentMedia) return undefined
    if (currentMedia.filePath) return toFileUrl(currentMedia.filePath)
    if (currentMedia.previewUrl && !isYouTube(currentMedia.previewUrl)) return currentMedia.previewUrl
    if (currentMedia.trailerUrl && !isYouTube(currentMedia.trailerUrl)) return currentMedia.trailerUrl
    return undefined
  }, [currentMedia])

  // Apply audio enhancements (EQ, normalization, ReplayGain)
  const applyAudioEnhancements = (howl: Howl) => {
    let targetVolume = volume

    // Apply normalization
    if (audioSettings.normalizationEnabled) {
      targetVolume = Math.min(1, audioSettings.targetVolume)
    }

    // Apply ReplayGain (simulated via volume adjustment)
    if (audioSettings.replayGainEnabled) {
      const preampMultiplier = Math.pow(10, audioSettings.replayGainPreamp / 20)
      targetVolume = Math.min(1, targetVolume * preampMultiplier)
    }

    howl.volume(targetVolume)
  }

  // Preload next track for gapless playback
  const preloadNextTrack = () => {
    if (!audioSettings.gaplessEnabled) return
    const nextIndex = currentIndex + 1
    if (nextIndex >= queue.length) return

    const nextId = queue[nextIndex]
    const nextMedia = media.find((m) => m.id === nextId)
    if (!nextMedia) return

    let nextUrl: string | undefined
    if (nextMedia.filePath) nextUrl = toFileUrl(nextMedia.filePath)
    else if (nextMedia.previewUrl && !isYouTube(nextMedia.previewUrl)) nextUrl = nextMedia.previewUrl
    else if (nextMedia.trailerUrl && !isYouTube(nextMedia.trailerUrl)) nextUrl = nextMedia.trailerUrl

    if (nextUrl && !nextHowlRef.current) {
      nextHowlRef.current = new Howl({
        src: [nextUrl],
        html5: true,
        preload: true,
        volume: 0,
      })
    }
  }

  // Load and play current track with Howler
  useEffect(() => {
    if (spotifyCurrent || !currentMedia || !sourceUrl) return

    // Clean up previous Howl
    if (currentHowlRef.current) {
      currentHowlRef.current.unload()
      currentHowlRef.current = null
    }
    if (nextHowlRef.current) {
      nextHowlRef.current.unload()
      nextHowlRef.current = null
    }

    // Create new Howl instance
    const howl = new Howl({
      src: [sourceUrl],
      html5: true,
      volume: volume,
      onload: () => {
        setDuration(howl.duration())
        applyAudioEnhancements(howl)
      },
      onplay: () => {
        setIsPlaying(true)
        // Start update interval
        if (updateIntervalRef.current) clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = window.setInterval(() => {
          const seek = howl.seek()
          if (typeof seek === 'number') {
            setCurrentTime(seek)
            // Trigger crossfade near end if enabled
            if (audioSettings.crossfadeEnabled && !crossfadeInProgressRef.current) {
              const remaining = howl.duration() - seek
              if (remaining <= audioSettings.crossfadeDuration && remaining > 0) {
                crossfadeInProgressRef.current = true
                const fadeOutDuration = audioSettings.crossfadeDuration * 1000
                howl.fade(howl.volume(), 0, fadeOutDuration)
                // Preload and start next track
                if (nextHowlRef.current) {
                  applyAudioEnhancements(nextHowlRef.current)
                  nextHowlRef.current.play()
                  nextHowlRef.current.fade(0, volume, fadeOutDuration)
                }
              }
            }
          }
        }, 100)
        preloadNextTrack()
      },
      onpause: () => {
        setIsPlaying(false)
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current)
          updateIntervalRef.current = undefined
        }
      },
      onstop: () => {
        setIsPlaying(false)
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current)
          updateIntervalRef.current = undefined
        }
      },
      onend: () => {
        if (currentMedia) {
          markAsWatched(currentMedia.id, howl.duration())
        }
        crossfadeInProgressRef.current = false
        // If crossfade handled next track, swap refs
        if (nextHowlRef.current) {
          currentHowlRef.current = nextHowlRef.current
          nextHowlRef.current = null
        }
        playNext()
      },
    })

    currentHowlRef.current = howl

    // Seek to saved progress
    if (currentMedia.progress && currentMedia.progress > 0) {
      howl.seek(currentMedia.progress)
    }

    // Auto-play
    howl.play()

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = undefined
      }
      if (currentHowlRef.current) {
        currentHowlRef.current.unload()
        currentHowlRef.current = null
      }
      if (nextHowlRef.current) {
        nextHowlRef.current.unload()
        nextHowlRef.current = null
      }
    }
  }, [currentMedia, sourceUrl, volume, markAsWatched, playNext, setIsPlaying, spotifyCurrent, audioSettings, media, queue, currentIndex])

  // Sync with Spotify playback if active
  useEffect(() => {
    if (!spotifyCurrent) return
    setCurrentTime((spotifyCurrent.progress || 0) / 1000)
    setDuration((spotifyCurrent.duration || 0) / 1000)
    // Keep a short interval to update progress (in addition to store polling)
    const id = setInterval(() => {
      const st = useSpotifyPlaybackStore.getState().currentTrack
      if (st) setCurrentTime((st.progress || 0) / 1000)
    }, 1000)
    return () => clearInterval(id)
  }, [spotifyCurrent])

  // Keep Howler volume in sync
  useEffect(() => {
    if (currentHowlRef.current && !crossfadeInProgressRef.current) {
      applyAudioEnhancements(currentHowlRef.current)
    }
  }, [volume, audioSettings])

  // Persist progress when track changes/unmounts
  useEffect(() => {
    return () => {
      if (currentMedia && currentTime > 0) {
        markAsWatched(currentMedia.id, currentTime)
      }
    }
  }, [currentMedia, currentTime, markAsWatched])

  const handlePlayPause = () => {
    const howl = currentHowlRef.current
    if (!howl) return
    if (isPlaying) {
      howl.pause()
    } else {
      howl.play()
    }
  }

  const handleSeek = (value: number) => {
    const howl = currentHowlRef.current
    if (!howl) return
    howl.seek(value)
    setCurrentTime(value)
  }

  const handleVolumeChange = (value: number) => {
    const vol = Math.max(0, Math.min(1, value))
    setVolume(vol)
    if (currentHowlRef.current) {
      applyAudioEnhancements(currentHowlRef.current)
    }
  }

  // If Spotify is active, show Spotify info instead of local audio element
  const isSpotifyActive = !!spotifyCurrent

  if (!currentMedia && !isSpotifyActive) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/95 border-t border-surface px-4 py-3 z-40 backdrop-blur">
      {/* Show either Spotify or local audio UI */}
      {isSpotifyActive ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-[200px]">
            <button
              onClick={spotifyToggle}
              className="p-2 bg-primary text-white hover:bg-primary/80 transition rounded-none"
              aria-label={spotifyPlaying ? 'Pause' : 'Play'}
            >
              {spotifyPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-light line-clamp-1 flex items-center gap-1">
                <Music2 size={14} className="text-highlight" />
                <span>{spotifyCurrent?.name}</span>
              </div>
              <div className="text-xs text-gray-400">{spotifyCurrent?.artist || ''}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={spotifyPrev}
              className="p-2 hover:bg-surface rounded-none text-gray-200"
              aria-label="Previous"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={spotifyNext}
              className="p-2 hover:bg-surface rounded-none text-gray-200"
              aria-label="Next"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs text-gray-400 w-12 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => spotifySeek(Number(e.target.value) * 1000)}
              className="w-full accent-primary"
            />
            <span className="text-xs text-gray-400 w-12">{formatTime(duration || 0)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-gray-300" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-24 accent-primary"
            />
          </div>

          <button
            onClick={clear}
            className="p-2 hover:bg-surface rounded-none text-gray-400"
            aria-label="Clear queue"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-[200px]">
            <button
              onClick={handlePlayPause}
              className="p-2 bg-primary text-white hover:bg-primary/80 transition rounded-none"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-light line-clamp-1 flex items-center gap-1">
                <Music2 size={14} className="text-highlight" />
                <span>{currentMedia?.title || 'Unknown'}</span>
              </div>
              <div className="text-xs text-gray-400">
                {currentMedia?.description || currentMedia?.tags?.[0] || currentMedia?.genres?.[0] || 'Music'}
                {queue.length > 0 && ` • ${currentIndex + 1} / ${queue.length}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={playPrevious}
              className="p-2 hover:bg-surface rounded-none text-gray-200"
              aria-label="Previous"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={playNext}
              className="p-2 hover:bg-surface rounded-none text-gray-200"
              aria-label="Next"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs text-gray-400 w-12 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="text-xs text-gray-400 w-12">{formatTime(duration || 0)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-gray-300" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-24 accent-primary"
            />
          </div>

          <button
            onClick={clear}
            className="p-2 hover:bg-surface rounded-none text-gray-400"
            aria-label="Clear queue"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
