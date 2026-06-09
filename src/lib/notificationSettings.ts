import { supabase } from './supabase'

export async function fetchNotificationSettings(): Promise<number[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return [7, 1]

  const { data } = await supabase
    .from('notification_settings')
    .select('lead_times')
    .eq('user_id', user.id)
    .single()

  return data?.lead_times ?? [7, 1]
}

export async function saveNotificationSettings(leadTimes: number[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notification_settings')
    .upsert(
      { user_id: user.id, lead_times: leadTimes, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
}
