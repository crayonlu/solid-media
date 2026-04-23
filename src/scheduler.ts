import type { FetcherFn, SchedulerTask } from './types.js'
import type { EventBus } from './event-bus.js'
import type { LRUCache } from './lru-cache.js'

const MAX_CONCURRENCY = 8
const MAX_RETRIES = 3
const RETRY_DELAYS: [number, number, number] = [1000, 2000, 4000]

function is4xxError(err: unknown): boolean {
  if (err instanceof Response) return err.status >= 400 && err.status < 500
  if (err instanceof Error && err.message.includes('4')) return false
  return false
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class Scheduler {
  private readonly queue: SchedulerTask[] = []
  private readonly inflight: Map<string, Promise<Blob>> = new Map()
  private activeCount = 0

  constructor(
    private readonly fetcher: () => FetcherFn,
    private readonly bus: EventBus,
    private readonly cache: LRUCache,
  ) {}

  schedule(url: string): Promise<string> {
    const cached = this.cache.get(url)
    if (cached) {
      this.cache.addRef(url)
      this.bus.emit('cache_hit', { url })
      return Promise.resolve(cached.objectUrl)
    }

    return new Promise<string>((resolve, reject) => {
      this.queue.push({ url, resolve, reject })
      this.drain()
    })
  }

  private drain(): void {
    while (this.activeCount < MAX_CONCURRENCY && this.queue.length > 0) {
      const task = this.queue.shift()
      if (!task) break
      this.activeCount++
      this.execute(task).finally(() => {
        this.activeCount--
        this.drain()
      })
    }
  }

  private async execute(task: SchedulerTask): Promise<void> {
    const { url, resolve, reject } = task

    const existing = this.inflight.get(url)
    if (existing) {
      try {
        const blob = await existing
        const objectUrl = this.resolveBlob(url, blob)
        resolve(objectUrl)
      } catch (err) {
        reject(err)
      }
      return
    }

    const fetchPromise = this.fetchWithRetry(url)
    this.inflight.set(url, fetchPromise)

    try {
      const blob = await fetchPromise
      const objectUrl = this.resolveBlob(url, blob)
      this.bus.emit('success', { url })
      resolve(objectUrl)
    } catch (err) {
      this.bus.emit('error', { url, error: err })
      reject(err)
    } finally {
      this.inflight.delete(url)
    }
  }

  private resolveBlob(url: string, blob: Blob): string {
    const cached = this.cache.get(url)
    if (cached) {
      this.cache.addRef(url)
      return cached.objectUrl
    }
    const objectUrl = URL.createObjectURL(blob)
    const entry = this.cache.set(url, objectUrl)
    entry.refCount = 1
    return objectUrl
  }

  private async fetchWithRetry(url: string): Promise<Blob> {
    const fn = this.fetcher()
    let lastError: unknown

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn(url)
      } catch (err) {
        lastError = err
        if (is4xxError(err) || attempt === MAX_RETRIES) {
          throw err
        }
        const waitMs = RETRY_DELAYS[attempt] ?? 4000
        this.bus.emit('retry', { url, attempt: attempt + 1 })
        await delay(waitMs)
      }
    }

    throw lastError
  }
}
