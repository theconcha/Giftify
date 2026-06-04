export interface Person {
  id: string
  user_id: string
  first_name: string
  last_name: string
  birthday_month: number | null
  birthday_day: number | null
  birthday_year: number | null
  street_address: string | null
  email_address: string | null
  photo_url: string | null
  gender: 'male' | 'female' | 'non_binary' | 'other' | null
  pronouns: 'he_him' | 'she_her' | 'he_they' | 'she_they' | 'they_them' | 'other' | null
  religion: 'christian' | 'jewish' | 'islam' | 'hinduism' | 'buddhism' | 'confucianism' | 'taoism' | 'shinto' | 'atheist' | 'agnostic' | 'jainism' | 'sikhism' | 'other' | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type PersonInsert = Omit<Person, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type PersonUpdate = Partial<PersonInsert>

export interface Product {
  id: string
  user_id: string
  name: string
  url: string | null
  sku: string | null
  photo_url: string | null
  description: string | null
  price: number | null
  categories: string[]
  is_favorited: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type ProductInsert = Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type ProductUpdate = Partial<ProductInsert>

export interface Holiday {
  id: string
  user_id: string | null
  name: string
  icon_url: string | null
  anchor_month: number | null
  anchor_day: number | null
  is_system: boolean
  created_at: string
}

export type HolidayInsert = Omit<Holiday, 'id' | 'user_id' | 'created_at'>
export type HolidayUpdate = Partial<HolidayInsert>

export interface Occasion {
  id: string
  user_id: string
  holiday_id: string | null
  name: string
  date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OccasionWithDetails extends Occasion {
  holiday: Holiday | null
  recipients: Person[]
  occasion_people?: { person_id: string; person: Person }[]
}

export type OccasionInsert = Omit<Occasion, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type OccasionUpdate = Partial<OccasionInsert>
