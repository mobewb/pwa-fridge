export interface User {
  id: number
  email: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface Category {
  id: number
  user_id: number | null
  name: string
  emoji: string
  default_expiry_days: number
  created_at: string
  is_default: boolean
}

export interface Product {
  id: number
  name: string
  quantity: number
  unit: string | null
  category: string | null
  purchase_date: string
  expiry_date: string
  consumed: boolean
  notes: string | null
  days_left: number
  expired: boolean
  created_at: string
  updated_at: string
}

export interface ProductInput {
  name: string
  quantity: number
  unit?: string | null
  category?: string | null
  purchase_date?: string
  expiry_date: string
  notes?: string | null
}

export type ProductPatch = Partial<ProductInput> & { consumed?: boolean }
