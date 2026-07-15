import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import EditMovieForm from './EditMovieForm'

export const dynamic = 'force-dynamic'

export default async function EditMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const movie = await prisma.movie.findUnique({
    where: { id },
    include: { genres: true }
  })

  if (!movie) {
    redirect('/admin/movies')
  }

  return <EditMovieForm movie={movie} />
}
