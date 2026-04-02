import { getSession } from '@/lib/auth'
import getDb from '@/lib/db'
import { ALL_MODULES } from '@/content/modules'
import PracticeClient from './PracticeClient'
import Link from 'next/link'

export default async function PracticePage() {
  const session = await getSession()
  const db = getDb()
  const now = Date.now()

  const dueWords = db.prepare(`
    SELECT * FROM vocab_progress WHERE user_id = ? AND next_review_at <= ? ORDER BY next_review_at ASC LIMIT 10
  `).all(session!.userId, now) as Array<{ word_id: string; module_slug: string }>

  const cards = dueWords.flatMap(row => {
    const mod = ALL_MODULES.find(m => m.slug === row.module_slug)
    const vocab = mod?.vocab.find(v => `${row.module_slug}:${v.id}` === row.word_id)
    if (!vocab || !mod) return []
    return [{ wordId: row.word_id, moduleSlug: row.module_slug, ...vocab }]
  })

  if (cards.length === 0) {
    return (
      <div className="max-w-lg mx-auto w-full px-4 py-12 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-green-800 mb-2">All caught up!</h2>
        <p className="text-gray-500 mb-1">No words to review right now.</p>
        <p className="text-gray-400 text-sm mb-8">¡Al día! No hay palabras para repasar ahora.</p>
        <Link href="/modules">
          <button className="bg-green-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-800 transition-colors">
            Go learn something new →
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto w-full px-4 py-6">
      <h1 className="text-2xl font-bold text-green-800 mb-1">Review</h1>
      <p className="text-gray-500 text-sm mb-6">Repaso · {cards.length} words due / palabras</p>
      <PracticeClient cards={cards} />
    </div>
  )
}
