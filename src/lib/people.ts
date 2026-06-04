import { supabase } from './supabase'
import type { PersonInsert, PersonUpdate } from '../types'

export async function fetchPeople(options: {
  search?: string
  showArchived?: boolean
  page?: number
  perPage?: number
} = {}) {
  const { search = '', showArchived = false, page = 1, perPage = 20 } = options
  const start = (page - 1) * perPage
  const end = start + perPage - 1

  let query = supabase
    .from('people')
    .select('*', { count: 'exact' })
    .order('first_name', { ascending: true })
    .range(start, end)

  if (!showArchived) query = query.eq('is_archived', false)
  if (search.trim()) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)

  return query
}

export async function fetchPerson(id: string) {
  return supabase.from('people').select('*').eq('id', id).single()
}

export async function createPerson(data: PersonInsert) {
  const { data: { user } } = await supabase.auth.getUser()
  return supabase.from('people').insert({ ...data, user_id: user!.id }).select().single()
}

export async function updatePerson(id: string, data: PersonUpdate) {
  return supabase.from('people').update(data).eq('id', id).select().single()
}

export async function archivePerson(id: string, archived: boolean) {
  return supabase.from('people').update({ is_archived: archived }).eq('id', id)
}

export async function deletePerson(id: string) {
  return supabase.from('people').delete().eq('id', id)
}
