// Doujinshi importer for nhentai.net and hitomi.la
// Supports direct URL import with optional CORS proxy

// @ts-ignore - Vite env types
const CORS_PROXY: string | undefined = import.meta.env.VITE_CORS_PROXY
// @ts-ignore - Vite env types
const NHENTAI_BASE: string = (import.meta.env.VITE_NHENTAI_BASE as string) || 'https://nhentai.net'

export interface ImportedDoujin {
  id: string
  title: string
  cover?: string
  tags: string[]
  artists: string[]
  languages: string[]
  year?: number
  description?: string
  source: 'nhentai' | 'hitomi'
}

function withProxy(url: string): string {
  if (!CORS_PROXY) return url
  // Support proxies expecting "<proxy><url>" or "<proxy>?url=<url>"
  return CORS_PROXY.includes('?') ? `${CORS_PROXY}${encodeURIComponent(url)}` : `${CORS_PROXY}${url}`
}

// --------------------- NHENTAI ---------------------

function extractNhentaiId(url: string): string | null {
  const m = url.match(/\/g\/(\d+)/)
  return m ? m[1] : null
}

async function fetchNhentaiApi(id: string): Promise<any | null> {
  const apiUrl = `${NHENTAI_BASE.replace(/\/$/, '')}/api/gallery/${id}`
  try {
    const res = await fetch(withProxy(apiUrl))
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function importFromNhentai(url: string): Promise<ImportedDoujin | null> {
  const id = extractNhentaiId(url)
  if (!id) return null

  // Try API first
  const data = await fetchNhentaiApi(id)
  if (data) {
    const title = data.title?.english || data.title?.pretty || data.title?.japanese || `nhentai ${id}`
    const cover = data.images?.cover
      ? `https://t.nhentai.net/galleries/${data.media_id}/${data.images.cover.t || 'cover'}.jpg`
      : undefined
    const tags: string[] = (data.tags || []).map((t: any) => t.name)
    const artists = (data.tags || []).filter((t: any) => t.type === 'artist').map((t: any) => t.name)
    const languages = (data.tags || []).filter((t: any) => t.type === 'language').map((t: any) => t.name.toUpperCase())
    const uploadDate = data.upload_date ? new Date(data.upload_date * 1000) : undefined

    return {
      id,
      title,
      cover,
      tags,
      artists,
      languages,
      year: uploadDate?.getFullYear(),
      description: `nhentai #${id}`,
      source: 'nhentai',
    }
  }

  // Fallback: fetch HTML via proxy and attempt to parse some basics
  try {
    const htmlRes = await fetch(withProxy(`${NHENTAI_BASE.replace(/\/$/, '')}/g/${id}/`))
    const html = await htmlRes.text()
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"\s*\/>/)
    const coverMatch = html.match(/<meta property="og:image" content="([^"]+)"\s*\/>/)
    const title = titleMatch ? titleMatch[1] : `nhentai ${id}`
    const cover = coverMatch ? coverMatch[1] : undefined

    return {
      id,
      title,
      cover,
      tags: [],
      artists: [],
      languages: [],
      source: 'nhentai',
    }
  } catch {
    return null
  }
}

// --------------------- HITOMI ---------------------

function extractHitomiId(url: string): string | null {
  const m = url.match(/galleries\/(\d+)/)
  return m ? m[1] : null
}

async function fetchHitomiJs(id: string): Promise<any | null> {
  const jsUrl = `https://ltn.hitomi.la/galleries/${id}.js`
  try {
    const res = await fetch(withProxy(jsUrl))
    if (!res.ok) return null
    const txt = await res.text()
    const m = txt.match(/galleryinfo\s*=\s*(\{[\s\S]*\});/)
    if (!m) return null
    // Eval-free parse: JSON in JS may not be strict; attempt basic cleanup
    const jsonLike = m[1]
      .replace(/(\w+):/g, '"$1":')
      .replace(/'([^']*)'/g, '"$1"')
    try {
      return JSON.parse(jsonLike)
    } catch {
      return null
    }
  } catch {
    return null
  }
}

export async function importFromHitomi(url: string): Promise<ImportedDoujin | null> {
  const id = extractHitomiId(url)
  if (!id) return null

  const data = await fetchHitomiJs(id)
  if (data) {
    const title: string = data.title || `hitomi ${id}`
    const cover: string | undefined = data.files?.[0]
      ? `https://a.hitomi.la/avif/${data.files[0].hash.slice(-1)}/${data.files[0].hash.slice(-3, -1)}/${data.files[0].hash}.avif`
      : undefined
    const tags: string[] = (data.tags || []).map((t: any) => t.tag)
    const artists: string[] = (data.artists || []).map((a: any) => a.artist)
    const languages: string[] = data.language ? [String(data.language).toUpperCase()] : []

    const date = data.date ? new Date(data.date) : undefined

    return {
      id,
      title,
      cover,
      tags,
      artists,
      languages,
      year: date?.getFullYear(),
      description: data.series ? `Series: ${data.series}` : undefined,
      source: 'hitomi',
    }
  }

  // Fallback basic scrape from page
  try {
    const pageUrl = `https://hitomi.la/galleries/${id}.html`
    const res = await fetch(withProxy(pageUrl))
    const html = await res.text()
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"\s*\/>/)
    const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"\s*\/>/)
    return {
      id,
      title: titleMatch ? titleMatch[1] : `hitomi ${id}`,
      cover: imgMatch ? imgMatch[1] : undefined,
      tags: [],
      artists: [],
      languages: [],
      source: 'hitomi',
    }
  } catch {
    return null
  }
}

export async function importDoujinFromUrl(url: string): Promise<ImportedDoujin | null> {
  if (/nhentai\.net\//.test(url)) return importFromNhentai(url)
  if (/hitomi\.(la|li)\//.test(url)) return importFromHitomi(url)
  return null
}
