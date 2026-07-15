import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'

export const mediaFolders = ['posters', 'backdrops', 'trailers', 'videos', 'subtitles'] as const
export type MediaFolder = (typeof mediaFolders)[number]

export function assertMediaFolder(folder: string): MediaFolder {
  if (mediaFolders.includes(folder as MediaFolder)) return folder as MediaFolder
  throw new Error(`Invalid media folder: ${folder}`)
}

export async function uploadToSupabaseStorage(key: string, file: File) {
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(env.supabaseStorageBucket).upload(key, file, {
    upsert: false,
  })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(env.supabaseStorageBucket).getPublicUrl(key)
  return data.publicUrl
}
