import { getSessionUser, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import EditSeriesForm from './EditSeriesForm'

export const dynamic = 'force-dynamic'

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!hasRole(user, 'ADMIN')) redirect('/')

  const series = await prisma.series.findUnique({
    where: { id },
    include: { genres: true }
  })

  if (!series) {
    redirect('/admin/series')
  }

  return <EditSeriesForm series={series} />
}
