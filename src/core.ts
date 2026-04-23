import type { FetcherFn, MediaEventType, MediaEventHandler } from './types.js'
import { EventBus } from './event-bus.js'
import { LRUCache } from './lru-cache.js'
import { Scheduler } from './scheduler.js'

const defaultFetcher: FetcherFn = async (url: string): Promise<Blob> => {
  const res = await fetch(url)
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${url}`)
    Object.assign(err, { status: res.status })
    throw err
  }
  return res.blob()
}

class SolidMediaCore {
  private fetcher: FetcherFn = defaultFetcher
  readonly bus: EventBus = new EventBus()
  readonly cache: LRUCache = new LRUCache()
  private _scheduler: Scheduler | null = null

  private get scheduler(): Scheduler {
    if (!this._scheduler) {
      this._scheduler = new Scheduler(() => this.fetcher, this.bus, this.cache)
    }
    return this._scheduler
  }

  setFetcher(fn: FetcherFn): void {
    this.fetcher = fn
    this._scheduler = null
  }

  on(event: MediaEventType, handler: MediaEventHandler): void {
    this.bus.on(event, handler)
  }

  off(event: MediaEventType, handler: MediaEventHandler): void {
    this.bus.off(event, handler)
  }

  load(url: string): Promise<string> {
    return this.scheduler.schedule(url)
  }

  release(url: string): void {
    this.cache.releaseRef(url)
    this.cache.flushPendingRevoke()
  }
}

export const core = new SolidMediaCore()
export type { SolidMediaCore }
