import { supabase } from './supabase'

export async function uploadProductImage(file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true })

  if (error) return null

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

export async function deleteProductImage(url: string): Promise<void> {
  const path = url.split('/product-images/')[1]
  if (path) await supabase.storage.from('product-images').remove([path])
}
