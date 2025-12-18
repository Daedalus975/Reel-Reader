import type { Source } from './sourceModel'

type Callback = (events: { added: string[]; removed: string[] }) => void

// Simple watcher stub: in real world this will use fs.watch / watchman / chokidar
export class SourceWatcher {
  source: Source
  interval: number
  _timer: any | null
  _last: string[]
  constructor(source: Source, interval = 5000) {
    this.source = source
    this.interval = interval
    this._timer = null
    this._last = []
  }

  start(cb: Callback) {
    if (this._timer) return
    this._timer = setInterval(async () => {
      // A stub: in practice we'd observe filesystem changes; for now we call scanSource
      cb({ added: [], removed: [] })
    }, this.interval)
  }

  stop() {
    if (this._timer) clearInterval(this._timer)
    this._timer = null
  }
}

export default SourceWatcher
