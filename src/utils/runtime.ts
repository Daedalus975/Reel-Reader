export const isDesktop = (): boolean => {
  try {
    // Tauri exposes internal symbols on window; this is a safe, synchronous check
    // and avoids importing any Tauri modules at module evaluation time.
    // Keep this minimal to be safe in web builds.
    // @ts-ignore
    return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__
  } catch {
    return false
  }
}

export default isDesktop
