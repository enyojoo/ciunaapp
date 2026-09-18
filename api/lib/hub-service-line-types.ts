export type HubServiceLineGridKind = "hub_category" | "app_link" | "external_url"

export interface HubServiceLineRow {
  id: string
  slug: string
  title: string
  short_description: string | null
  sort_order: number
  is_enabled: boolean
  icon_url: string | null
  icon_key: string | null
  grid_kind: HubServiceLineGridKind
  route_path: string | null
  href: string | null
  created_at: string
  updated_at: string
}
