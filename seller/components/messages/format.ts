export type SellerOrderStatus = "new" | "accepted" | "preparing" | "completed" | "cancelled"
export interface Thread {
  orderId: string
  publicId: string
  customerName: string | null
  lastMessage: string
  lastFrom: "customer" | "merchant"
  lastAt: string
  unread: number
  status: SellerOrderStatus
  closed: boolean
}
export interface ChatMessage { id: number; senderKind: "customer" | "merchant"; body: string; language: string; createdAt: string; readAt: string | null }
export interface ThreadResponse {
  messages: ChatMessage[]
  closed: boolean
  available: boolean
  order: { id: string; publicId: string; customerName: string | null; status: SellerOrderStatus }
}

export const MAX_BODY = 2000
export const QUICK_REPLY_KEYS = ["messages.quick.preparing", "messages.quick.delivery", "messages.quick.thanks", "messages.quick.question"] as const

/** Appends a quick reply to the draft, never past the limit. */
export function insertQuick(draft: string, text: string): string {
  const next = draft.trim() ? `${draft.replace(/\s+$/, "")} ${text}` : text
  return [...next].length > MAX_BODY ? draft : next
}

/** Newest customer message id that still needs a read receipt, or null. */
export function unreadCustomerId(messages: ChatMessage[]): number | null {
  let id: number | null = null
  for (const m of messages) if (m.senderKind === "customer" && !m.readAt) id = m.id
  return id
}
