'use server'

import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addEpisodeToSeries(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) {
    return { error: 'Unauthorized' }
  }

  const seriesId = formData.get('seriesId') as string
  const seasonNumber = parseInt(formData.get('seasonNumber') as string, 10)
  const episodeNumber = parseInt(formData.get('episodeNumber') as string, 10)
  const title = formData.get('title') as string
  const videoUrl = formData.get('videoUrl') as string

  if (!seriesId || isNaN(seasonNumber) || isNaN(episodeNumber) || !title) {
    return { error: 'Season number, episode number, and title are required.' }
  }
  if (!videoUrl) {
    return { error: 'Please provide a video URL or upload a video file.' }
  }

  try {
    // Find or create the season
    let season = await prisma.season.findUnique({
      where: {
        seriesId_number: {
          seriesId,
          number: seasonNumber,
        }
      }
    })

    if (!season) {
      season = await prisma.season.create({
        data: {
          seriesId,
          number: seasonNumber,
          title: `Season ${seasonNumber}`,
        }
      })
    }

    // Upsert the episode: update if episode number already exists in this season,
    // otherwise create it fresh. This avoids the unique constraint crash.
    await prisma.episode.upsert({
      where: {
        seasonId_number: {
          seasonId: season.id,
          number: episodeNumber,
        }
      },
      create: {
        seasonId: season.id,
        number: episodeNumber,
        title: title,
        videoUrl: videoUrl,
        published: true,
      },
      update: {
        title: title,
        videoUrl: videoUrl,
        published: true,
      }
    })

    // Fetch the series slug so we can revalidate the correct public page
    const fullSeries = await prisma.series.findUnique({
      where: { id: seriesId },
      select: { slug: true },
    })

    // Bust cache for admin page, public series page, and homepage
    revalidatePath(`/admin/series/${seriesId}/episodes`)
    if (fullSeries?.slug) {
      revalidatePath(`/series/${fullSeries.slug}`)
    }
    revalidatePath('/', 'page')

  } catch (err: any) {
    console.error('addEpisodeToSeries error:', err)
    return { error: err?.message ?? 'Failed to save episode. Please try again.' }
  }

  // Redirect back so the admin sees the updated episode list immediately
  redirect(`/admin/series/${seriesId}/episodes`)
}
