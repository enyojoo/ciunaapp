/** Topics refreshed when Office edits public app configuration. */
export type OfficeConfigTopic = "fx" | "paymentMethods" | "publicFlags" | "hubServiceLines"

const listeners: Record<OfficeConfigTopic, Set<() => void>> = {
  fx: new Set(),
  paymentMethods: new Set(),
  publicFlags: new Set(),
  hubServiceLines: new Set(),
}

export function subscribeOfficeConfigRevalidate(topic: OfficeConfigTopic, fn: () => void): () => void {
  listeners[topic].add(fn)
  return () => {
    listeners[topic].delete(fn)
  }
}

export function triggerOfficeConfigRevalidate(topic: OfficeConfigTopic): void {
  listeners[topic].forEach((fn) => {
    try {
      fn()
    } catch {
      // ignore listener errors
    }
  })
}

export function triggerAllOfficeConfigRevalidate(): void {
  (Object.keys(listeners) as OfficeConfigTopic[]).forEach(triggerOfficeConfigRevalidate)
}
