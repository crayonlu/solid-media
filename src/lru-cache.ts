import type { CacheEntry } from './types.js'

const MAX_ITEMS = 50

export class LRUCache {
  private readonly store: Map<string, CacheEntry> = new Map()
  private readonly pendingRevoke: Set<string> = new Set()

  get(url: string): CacheEntry | undefined {
    const entry = this.store.get(url)
    if (entry) {
      entry.lastUsed = Date.now()
    }
    return entry
  }

  set(url: string, objectUrl: string): CacheEntry {
    const existing = this.store.get(url)
    if (existing) {
      existing.lastUsed = Date.now()
      return existing
    }

    const entry: CacheEntry = {
      objectUrl,
      refCount: 0,
      lastUsed: Date.now(),
    }
    this.store.set(url, entry)
    this.evictIfNeeded()
    return entry
  }

  addRef(url: string): void {
    const entry = this.store.get(url)
    if (!entry) return
    entry.refCount++
    this.pendingRevoke.delete(url)
  }

  releaseRef(url: string): void {
    const entry = this.store.get(url)
    if (!entry) return
    entry.refCount = Math.max(0, entry.refCount - 1)
    if (entry.refCount === 0) {
      this.pendingRevoke.add(url)
    }
  }

  private evictIfNeeded(): void {
    if (this.store.size <= MAX_ITEMS) return

    let lruKey: string | null = null
    let lruTime = Infinity

    for (const [key, entry] of this.store) {
      if (entry.refCount === 0 && entry.lastUsed < lruTime) {
        lruTime = entry.lastUsed
        lruKey = key
      }
    }

    if (lruKey) {
      this.revoke(lruKey)
    }
  }

  private revoke(url: string): void {
    const entry = this.store.get(url)
    if (entry) {
      if (typeof URL !== 'undefined') {
        URL.revokeObjectURL(entry.objectUrl)
      }
      this.store.delete(url)
      this.pendingRevoke.delete(url)
    }
  }

  flushPendingRevoke(): void {
    for (const url of this.pendingRevoke) {
      const entry = this.store.get(url)
      if (entry && entry.refCount === 0) {
        this.revoke(url)
      }
    }
  }
}
