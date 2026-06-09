import { supabase } from './supabase'
import type { GiftInsert, GiftUpdate } from '../types'

const GIFT_SELECT = `
  *,
  product:products(id, name, photo_url, price),
  occasion:occasions(id, name, date),
  gift_recipients(person_id, person:people(id, first_name, last_name, photo_url))
`

export async function fetchGifts(options: {
  status?: 'planned' | 'given'
  recipientId?: string
  productId?: string
  occasionId?: string
  startDate?: string
  endDate?: string
  page?: number
  perPage?: number
} = {}) {
  const { status, recipientId, productId, occasionId, startDate, endDate, page = 1, perPage = 20 } = options
  const start = (page - 1) * perPage
  const end = start + perPage - 1

  // Planned: sort by planned_date ascending (soonest first)
  // Given: sort by date_given descending (most recent first)
  const orderCol = status === 'planned' ? 'planned_date' : 'date_given'
  const orderAsc = status === 'planned'

  let query = supabase
    .from('gifts')
    .select(GIFT_SELECT, { count: 'exact' })
    .order(orderCol, { ascending: orderAsc })
    .range(start, end)

  if (status) query = query.eq('status', status)
  if (productId) query = query.eq('product_id', productId)
  if (occasionId) query = query.eq('occasion_id', occasionId)
  if (startDate) query = query.gte('date_given', startDate)
  if (endDate) query = query.lte('date_given', endDate)
  if (recipientId) {
    const { data: giftIds } = await supabase
      .from('gift_recipients')
      .select('gift_id')
      .eq('person_id', recipientId)
    query = query.in('id', giftIds?.map(r => r.gift_id) ?? [])
  }

  return query
}

export async function markAsGiven(id: string, dateGiven: string) {
  return supabase
    .from('gifts')
    .update({ status: 'given', date_given: dateGiven })
    .eq('id', id)
}

export async function fetchGiftsByPerson(personId: string) {
  const { data: rows } = await supabase
    .from('gift_recipients')
    .select('gift_id')
    .eq('person_id', personId)

  if (!rows?.length) return { data: [], error: null }

  return supabase
    .from('gifts')
    .select(GIFT_SELECT)
    .in('id', rows.map(r => r.gift_id))
    .order('date_given', { ascending: false })
}

export async function fetchGiftsByOccasion(occasionId: string) {
  return supabase
    .from('gifts')
    .select(GIFT_SELECT)
    .eq('occasion_id', occasionId)
    .order('date_given', { ascending: false })
}

export async function fetchGift(id: string) {
  return supabase.from('gifts').select(GIFT_SELECT).eq('id', id).single()
}

export async function createGift(data: GiftInsert, recipientIds: string[]) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: gift, error } = await supabase
    .from('gifts')
    .insert({ ...data, user_id: user!.id })
    .select()
    .single()

  if (error || !gift) return { data: null, error }

  if (recipientIds.length > 0) {
    await supabase.from('gift_recipients').insert(
      recipientIds.map(person_id => ({ gift_id: gift.id, person_id }))
    )
  }
  return { data: gift, error: null }
}

export async function updateGift(id: string, data: GiftUpdate, recipientIds: string[]) {
  const { error } = await supabase.from('gifts').update(data).eq('id', id)
  if (error) return { error }

  await supabase.from('gift_recipients').delete().eq('gift_id', id)
  if (recipientIds.length > 0) {
    await supabase.from('gift_recipients').insert(
      recipientIds.map(person_id => ({ gift_id: id, person_id }))
    )
  }
  return { error: null }
}

export async function deleteGift(id: string) {
  return supabase.from('gifts').delete().eq('id', id)
}
