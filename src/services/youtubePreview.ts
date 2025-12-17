declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApiPromise: Promise<void> | null = null

export function loadYouTubeAPI(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve()
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    document.body.appendChild(script)

    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (previous) previous()
      resolve()
    }
  })

  return youtubeApiPromise
}

export interface PreviewLoop {
  stop: () => void
}

interface PreviewConfig {
  startAt?: number // seconds
  playDuration?: number // seconds to play before skipping
  skipInterval?: number // seconds to jump ahead each loop
}

export function createPreviewLoop(container: HTMLElement, videoId: string, config?: PreviewConfig): Promise<PreviewLoop> {
  const startAt = config?.startAt ?? 10
  const playDuration = config?.playDuration ?? 5
  const skipInterval = config?.skipInterval ?? 20

  return loadYouTubeAPI().then(() => {
    let intervalId: ReturnType<typeof setTimeout> | null = null

    const player = new window.YT.Player(container, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        mute: 1,
      },
      events: {
        onReady: (event: any) => {
          event.target.mute()
          event.target.seekTo(startAt, true)
          event.target.playVideo()

          const loop = () => {
            const current = event.target.getCurrentTime?.() || startAt
            const next = current + skipInterval
            event.target.seekTo(next, true)
            event.target.playVideo()
            intervalId = setTimeout(loop, playDuration * 1000)
          }
          intervalId = setTimeout(loop, playDuration * 1000)
        },
      },
    })

    return {
      stop: () => {
        if (intervalId) clearTimeout(intervalId)
        try {
          player.destroy()
        } catch (e) {
          // ignore
        }
      },
    }
  })
}
