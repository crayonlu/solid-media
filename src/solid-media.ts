import { core } from './core.js'

type MediaType = 'image' | 'video'
type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'])
const VIDEO_BOOLEAN_ATTRS = ['autoplay', 'loop', 'muted', 'controls', 'playsinline'] as const

function inferType(src: string): MediaType {
  const ext = src.split('?')[0]?.split('.').pop()?.toLowerCase() ?? ''
  return VIDEO_EXTENSIONS.has(ext) ? 'video' : 'image'
}

export class SolidMedia extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['src', 'type', 'fallback', ...VIDEO_BOOLEAN_ATTRS]
  }

  private _currentSrc: string | null = null
  private _objectUrl: string | null = null
  private _state: LoadState = 'idle'
  private _observer: IntersectionObserver | null = null
  private _mediaEl: HTMLImageElement | HTMLVideoElement | null = null

  connectedCallback(): void {
    this._setupIntersectionObserver()
  }

  disconnectedCallback(): void {
    this._observer?.disconnect()
    this._observer = null
    this._releaseCurrentResource()
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'src' && oldValue !== newValue) {
      this._releaseCurrentResource()
      this._currentSrc = null
      this._objectUrl = null
      this._state = 'idle'

      if (this._observer) {
        this._observer.disconnect()
        this._setupIntersectionObserver()
      }
      return
    }

    if (VIDEO_BOOLEAN_ATTRS.includes(name as (typeof VIDEO_BOOLEAN_ATTRS)[number])) {
      if (this._mediaEl instanceof HTMLVideoElement) {
        this._syncVideoAttrs(this._mediaEl)
      }
    }
  }

  private _setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      this._triggerLoad()
      return
    }

    this._observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this._observer?.disconnect()
            this._observer = null
            this._triggerLoad()
            break
          }
        }
      },
      { rootMargin: '50px' },
    )
    this._observer.observe(this)
  }

  private _triggerLoad(): void {
    const src = this.getAttribute('src')
    if (!src || this._state === 'loading' || this._state === 'loaded') return
    this._state = 'loading'
    this._currentSrc = src
    this._renderFallback()

    core.load(src).then(
      (objectUrl) => {
        if (this._currentSrc !== src) return
        this._objectUrl = objectUrl
        this._state = 'loaded'
        this._renderMedia(objectUrl)
      },
      () => {
        if (this._currentSrc !== src) return
        this._state = 'error'
        this._renderFallback()
      },
    )
  }

  private _resolveType(): MediaType {
    const attr = this.getAttribute('type')
    if (attr === 'image' || attr === 'video') return attr
    const src = this.getAttribute('src') ?? ''
    return inferType(src)
  }

  private _renderMedia(objectUrl: string): void {
    const type = this._resolveType()
    this.innerHTML = ''

    if (type === 'video') {
      const video = document.createElement('video')
      video.src = objectUrl
      this._syncVideoAttrs(video)
      this._mediaEl = video
      this.appendChild(video)
    } else {
      const img = document.createElement('img')
      img.src = objectUrl
      this._mediaEl = img
      this.appendChild(img)
    }
  }

  private _renderFallback(): void {
    const fallback = this.getAttribute('fallback')
    this.innerHTML = ''
    this._mediaEl = null

    if (!fallback) return

    const type = this._resolveType()
    if (type === 'video') {
      const video = document.createElement('video')
      video.src = fallback
      this._syncVideoAttrs(video)
      this._mediaEl = video
      this.appendChild(video)
    } else {
      const img = document.createElement('img')
      img.src = fallback
      this._mediaEl = img
      this.appendChild(img)
    }
  }

  private _syncVideoAttrs(video: HTMLVideoElement): void {
    video.autoplay = this.hasAttribute('autoplay')
    video.loop = this.hasAttribute('loop')
    video.muted = this.hasAttribute('muted')
    video.controls = this.hasAttribute('controls')
    video.playsInline = this.hasAttribute('playsinline')
  }

  private _releaseCurrentResource(): void {
    if (this._currentSrc && this._objectUrl) {
      core.release(this._currentSrc)
      this._objectUrl = null
    }
    this._mediaEl = null
  }
}
