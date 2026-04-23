import { SolidMedia } from './solid-media.js'
import { core } from './core.js'
import type { SolidMediaCore } from './core.js'
import type { FetcherFn, MediaEventType, MediaEventHandler, MediaEventPayload } from './types.js'

export { SolidMedia, core }
export type { SolidMediaCore, FetcherFn, MediaEventType, MediaEventHandler, MediaEventPayload }

if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  if (!customElements.get('solid-media')) {
    customElements.define('solid-media', SolidMedia)
  }
}
