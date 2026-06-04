import { supabase } from './supabase'
import type { HolidayInsert, HolidayUpdate } from '../types'

export async function fetchHolidays() {
  return supabase
    .from('holidays')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name', { ascending: true })
}

export async function createHoliday(data: HolidayInsert) {
  const { data: { user } } = await supabase.auth.getUser()
  return supabase
    .from('holidays')
    .insert({ ...data, user_id: user!.id, is_system: false })
    .select()
    .single()
}

export async function updateHoliday(id: string, data: HolidayUpdate) {
  return supabase.from('holidays').update(data).eq('id', id).select().single()
}

export async function deleteHoliday(id: string) {
  return supabase.from('holidays').delete().eq('id', id)
}
