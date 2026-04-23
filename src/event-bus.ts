import type { MediaEventType, MediaEventHandler, MediaEventPayload } from './types.js'

type HandlerMap = Map<MediaEventType, Set<MediaEventHandler>>

export class EventBus {
  private readonly handlers: HandlerMap = new Map()

  on(event: MediaEventType, handler: MediaEventHandler): void {
    let set = this.handlers.get(event)
    if (!set) {
      set = new Set()
      this.handlers.set(event, set)
    }
    set.add(handler)
  }

  off(event: MediaEventType, handler: MediaEventHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  emit(event: MediaEventType, payload: MediaEventPayload): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload))
  }
}
