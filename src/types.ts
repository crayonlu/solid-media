export type MediaEventType = 'success' | 'error' | 'retry' | 'cache_hit'

export interface MediaEventPayload {
  url: string
  attempt?: number
  error?: unknown
}

export type MediaEventHandler = (payload: MediaEventPayload) => void

export type FetcherFn = (url: string) => Promise<Blob>

export interface CacheEntry {
  objectUrl: string
  refCount: number
  lastUsed: number
}

export interface SchedulerTask {
  url: string
  resolve: (objectUrl: string) => void
  reject: (reason: unknown) => void
}
