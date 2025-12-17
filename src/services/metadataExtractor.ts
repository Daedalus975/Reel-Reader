import type { MediaType } from '../types'
import { convertFileSrc } from '@tauri-apps/api/tauri'

export interface ExtractedMetadata {
  duration?: number // seconds
  resolution?: string // e.g., 1920x1080
  fileSize?: number // bytes
  bitrate?: number // kbps (approx)
  codec?: string
}

const VIDEO_EXT = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v']
const AUDIO_EXT = ['mp3', 'flac', 'm4a', 'wav', 'ogg', 'aac', 'wma']
const BOOK_EXT = ['epub', 'pdf', 'mobi', 'azw3', 'cbz', 'cbr']

function getExt(path: string) {
  const parts = path.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

function guessKind(type?: MediaType, path?: string): 'video' | 'audio' | 'book' {
  const ext = path ? getExt(path) : ''
  if (type === 'movie' || type === 'tv' || type === 'jav') return 'video'
  if (type === 'music' || type === 'podcast') return 'audio'
  if (type === 'book' || type === 'doujinshi') return 'book'
  if (VIDEO_EXT.includes(ext)) return 'video'
  if (AUDIO_EXT.includes(ext)) return 'audio'
  if (BOOK_EXT.includes(ext)) return 'book'
  return 'video'
}

async function getFileSize(filePath: string): Promise<number | undefined> {
  try {
    const fs = await import('@tauri-apps/api/fs') as any
    const metaFn = fs.metadata || fs.stat
    if (!metaFn) return undefined
    const info = await metaFn(filePath)
    return info?.size
  } catch (err) {
    console.warn('stat failed', err)
    return undefined
  }
}

type ProbedMedia = { duration?: number; resolution?: string }

async function probeMedia(filePath: string, kind: 'video' | 'audio'): Promise<ProbedMedia> {
  return new Promise((resolve) => {
    const el = document.createElement(kind === 'video' ? 'video' : 'audio') as HTMLMediaElement
    el.preload = 'metadata'
    el.style.position = 'fixed'
    el.style.width = '1px'
    el.style.height = '1px'
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
    el.src = convertFileSrc(filePath)

    const cleanup = () => {
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('error', onError)
      if (el.parentNode) el.parentNode.removeChild(el)
    }

    const onLoaded = () => {
      const duration = Number.isFinite(el.duration) ? el.duration : undefined
      const resolution = 'videoWidth' in el && 'videoHeight' in el
        ? ((el as HTMLVideoElement).videoWidth && (el as HTMLVideoElement).videoHeight
          ? `${(el as HTMLVideoElement).videoWidth}x${(el as HTMLVideoElement).videoHeight}`
          : undefined)
        : undefined
      cleanup()
      resolve({ duration, resolution })
    }

    const onError = () => {
      cleanup()
      resolve({})
    }

    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('error', onError)
    document.body.appendChild(el)
  })
}

export async function extractMediaMetadata(filePath: string, type?: MediaType): Promise<ExtractedMetadata> {
  const kind = guessKind(type, filePath)
  const [size, media]: [number | undefined, ProbedMedia] = await Promise.all([
    getFileSize(filePath),
    kind === 'book' ? Promise.resolve({} as ProbedMedia) : probeMedia(filePath, kind),
  ])

  const duration = media.duration
  const resolution = media.resolution
  const bitrate = duration && size ? Math.round((size * 8) / 1000 / duration) : undefined

  return {
    duration,
    resolution,
    fileSize: size,
    bitrate,
    codec: undefined,
  }
}
