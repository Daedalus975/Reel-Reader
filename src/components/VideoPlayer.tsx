import React, { useEffect, useRef, useState } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import type Player from 'video.js/dist/types/player'

interface VideoPlayerProps {
  src: string
  poster?: string
  currentTime?: number
  onTimeUpdate?: (time: number) => void
  onEnded?: () => void
  onPlay?: () => void
  onPause?: () => void
  autoplay?: boolean
  className?: string
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  currentTime = 0,
  onTimeUpdate,
  onEnded,
  onPlay,
  onPause,
  autoplay = false,
  className = '',
}) => {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js')
      videoElement.classList.add('vjs-big-play-centered')
      videoRef.current.appendChild(videoElement)

      const player = (playerRef.current = videojs(videoElement, {
        controls: true,
        responsive: true,
        fluid: true,
        preload: 'auto',
        poster: poster,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        controlBar: {
          volumePanel: {
            inline: false,
          },
          pictureInPictureToggle: true,
          fullscreenToggle: true,
        },
        userActions: {
          hotkeys: function (event: KeyboardEvent) {
            const player = this as any
            // Space bar = play/pause
            if (event.which === 32) {
              event.preventDefault()
              if (player.paused()) {
                player.play()
              } else {
                player.pause()
              }
            }
            // Left arrow = -10s
            if (event.which === 37) {
              event.preventDefault()
              player.currentTime(Math.max(0, player.currentTime() - 10))
            }
            // Right arrow = +10s
            if (event.which === 39) {
              event.preventDefault()
              player.currentTime(player.currentTime() + 10)
            }
            // F = fullscreen
            if (event.which === 70) {
              event.preventDefault()
              if (player.isFullscreen()) {
                player.exitFullscreen()
              } else {
                player.requestFullscreen()
              }
            }
            // M = mute
            if (event.which === 77) {
              event.preventDefault()
              player.muted(!player.muted())
            }
          },
        },
      }))

      player.ready(() => {
        setIsReady(true)
      })

      // Event listeners
      player.on('timeupdate', () => {
        onTimeUpdate?.(player.currentTime() || 0)
      })

      player.on('ended', () => {
        onEnded?.()
      })

      player.on('play', () => {
        onPlay?.()
      })

      player.on('pause', () => {
        onPause?.()
      })
    }
  }, [])

  // Update source
  useEffect(() => {
    const player = playerRef.current
    if (player && isReady && src) {
      player.src({ src, type: getVideoType(src) })
      
      // Resume from saved position
      if (currentTime > 0) {
        player.currentTime(currentTime)
      }

      if (autoplay) {
        player.play()
      }
    }
  }, [src, isReady, currentTime, autoplay])

  // Cleanup on unmount
  useEffect(() => {
    const player = playerRef.current
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [])

  return (
    <div data-vjs-player className={className}>
      <div ref={videoRef} />
    </div>
  )
}

function getVideoType(src: string): string {
  const ext = src.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'mp4':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'ogg':
      return 'video/ogg'
    case 'mkv':
      return 'video/x-matroska'
    case 'mov':
      return 'video/quicktime'
    default:
      return 'video/mp4'
  }
}
