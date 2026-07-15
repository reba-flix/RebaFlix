import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const favoriteSchema = z.object({
  movieId: z.string().min(1).optional(),
  seriesId: z.string().min(1).optional(),
  episodeId: z.string().min(1).optional(),
})

export const progressSchema = z.object({
  movieId: z.string().min(1).optional(),
  episodeId: z.string().min(1).optional(),
  positionSeconds: z.number().int().min(0),
  durationSeconds: z.number().int().min(1),
  completed: z.boolean().default(false),
})

export const ratingSchema = z.object({
  movieId: z.string().min(1).optional(),
  seriesId: z.string().min(1).optional(),
  value: z.number().int().min(1).max(5),
  review: z.string().max(2000).optional(),
})

export const commentSchema = z.object({
  movieId: z.string().min(1).optional(),
  seriesId: z.string().min(1).optional(),
  body: z.string().min(1).max(2000),
})
