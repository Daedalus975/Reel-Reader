/**
 * File utilities for local file linking via Tauri dialog
 */

export async function pickFile(filters?: { name: string; extensions: string[] }[]): Promise<string | null> {
  try {
    const { open } = await import('@tauri-apps/api/dialog')
    const selected = await open({
      multiple: false,
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    })
    return typeof selected === 'string' ? selected : null
  } catch (err) {
    console.error('File picker error:', err)
    return null
  }
}

export function getFileFilters(type: string): { name: string; extensions: string[] }[] {
  switch (type) {
    case 'movie':
    case 'tv':
    case 'jav':
      return [
        { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v'] },
        { name: 'All Files', extensions: ['*'] },
      ]
    case 'music':
      return [
        { name: 'Audio Files', extensions: ['mp3', 'flac', 'm4a', 'wav', 'ogg', 'aac', 'wma'] },
        { name: 'All Files', extensions: ['*'] },
      ]
    case 'book':
    case 'doujinshi':
      return [
        { name: 'eBooks', extensions: ['epub', 'pdf', 'mobi', 'azw3', 'cbz', 'cbr'] },
        { name: 'All Files', extensions: ['*'] },
      ]
    case 'podcast':
      return [
        { name: 'Audio/Video', extensions: ['mp3', 'm4a', 'mp4', 'webm', 'ogg'] },
        { name: 'All Files', extensions: ['*'] },
      ]
    default:
      return [{ name: 'All Files', extensions: ['*'] }]
  }
}

export async function openFile(filePath: string): Promise<void> {
  try {
    const { open: shellOpen } = await import('@tauri-apps/api/shell')
    await shellOpen(filePath)
  } catch (err) {
    console.error('Failed to open file:', err)
  }
}
