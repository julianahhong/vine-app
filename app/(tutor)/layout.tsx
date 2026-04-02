import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')
  if (session.role !== 'tutor') redirect('/home')

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-amber-600 text-white px-4 py-3 flex items-center gap-3 shadow">
        <span className="text-2xl">🌿</span>
        <div className="flex-1">
          <p className="font-bold">Vine Tutoring</p>
          <p className="text-amber-100 text-xs">Tutor: {session.name}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-amber-200 text-xs hover:text-white">Exit</button>
        </form>
      </header>
      {children}
    </div>
  )
}
