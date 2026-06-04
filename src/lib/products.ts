import { supabase } from './supabase'
import type { ProductInsert, ProductUpdate } from '../types'

export async function fetchProducts(options: {
  search?: string
  category?: string
  showArchived?: boolean
  favoritesOnly?: boolean
  page?: number
  perPage?: number
} = {}) {
  const { search = '', category = '', showArchived = false, favoritesOnly = false, page = 1, perPage = 20 } = options
  const start = (page - 1) * perPage
  const end = start + perPage - 1

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(start, end)

  if (!showArchived) query = query.eq('is_archived', false)
  if (favoritesOnly) query = query.eq('is_favorited', true)
  if (search.trim()) query = query.ilike('name', `%${search}%`)
  if (category) query = query.contains('categories', [category])

  return query
}

export async function fetchProduct(id: string) {
  return supabase.from('products').select('*').eq('id', id).single()
}

export async function createProduct(data: ProductInsert) {
  const { data: { user } } = await supabase.auth.getUser()
  return supabase.from('products').insert({ ...data, user_id: user!.id }).select().single()
}

export async function updateProduct(id: string, data: ProductUpdate) {
  return supabase.from('products').update(data).eq('id', id).select().single()
}

export async function toggleFavorite(id: string, isFavorited: boolean) {
  return supabase.from('products').update({ is_favorited: isFavorited }).eq('id', id)
}

export async function archiveProduct(id: string, archived: boolean) {
  return supabase.from('products').update({ is_archived: archived }).eq('id', id)
}

export async function deleteProduct(id: string) {
  return supabase.from('products').delete().eq('id', id)
}
