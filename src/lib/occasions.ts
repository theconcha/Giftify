import { supabase } from './supabase'
import type { OccasionInsert, OccasionUpdate } from '../types'

export async function fetchOccasions(options: {
  upcomingOnly?: boolean
  startDate?: string
  endDate?: string
  page?: number
  perPage?: number
} = {}) {
  const { upcomingOnly = false, startDate, endDate, page = 1, perPage = 20 } = options

  const selectQuery = `
    *,
    holiday:holidays(id, name, is_system),
    occasion_people(person_id, person:people(id, first_name, last_name, photo_url))
  `

  // Calendar mode: fetch all occasions in a date range (no pagination)
  if (startDate && endDate) {
    return supabase
      .from('occasions')
      .select(selectQuery, { count: 'exact' })
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
  }

  const start = (page - 1) * perPage
  const end = start + perPage - 1

  let query = supabase
    .from('occasions')
    .select(selectQuery, { count: 'exact' })
    .order('date', { ascending: upcomingOnly })
    .range(start, end)

  if (upcomingOnly) {
    const today = new Date().toISOString().split('T')[0]
    const ninetyDays = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    query = query.gte('date', today).lte('date', ninetyDays)
  }

  return query
}

export async function fetchOccasion(id: string) {
  return supabase
    .from('occasions')
    .select(`
      *,
      holiday:holidays(id, name, is_system),
      occasion_people(person_id, person:people(id, first_name, last_name, photo_url))
    `)
    .eq('id', id)
    .single()
}

export async function createOccasion(data: OccasionInsert, personIds: string[]) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: occasion, error } = await supabase
    .from('occasions')
    .insert({ ...data, user_id: user!.id })
    .select()
    .single()

  if (error || !occasion) return { data: null, error }

  if (personIds.length > 0) {
    await supabase.from('occasion_people').insert(
      personIds.map(person_id => ({ occasion_id: occasion.id, person_id }))
    )
  }

  return { data: occasion, error: null }
}

export async function updateOccasion(id: string, data: OccasionUpdate, personIds: string[]) {
  const { error } = await supabase.from('occasions').update(data).eq('id', id)
  if (error) return { error }

  await supabase.from('occasion_people').delete().eq('occasion_id', id)

  if (personIds.length > 0) {
    await supabase.from('occasion_people').insert(
      personIds.map(person_id => ({ occasion_id: id, person_id }))
    )
  }

  return { error: null }
}

export async function deleteOccasion(id: string) {
  return supabase.from('occasions').delete().eq('id', id)
}
