import { getSession } from '@/lib/auth'
import getDb from '@/lib/db'
import Link from 'next/link'
import { ALL_MODULES } from '@/content/modules'

const MODULE_EMOJIS: Record<string, string> = {
  Hand: '👋', Train: '🚇', ShoppingCart: '🛒', Users: '👨‍👩‍👧', Shirt: '👕', MessageSquare: '💬'
}

export default async function ModulesPage() {
  const session = await getSession()
  const db = getDb()
  const moduleProgress = db.prepare('SELECT * FROM module_progress WHERE user_id = ?').all(session!.userId) as Array<{
    module_slug: string; vocab_viewed_at: number | null; practice_completed_at: number | null; teach_session_count: number
  }>

  const getStatus = (slug: string) => {
    const p = moduleProgress.find(m => m.module_slug === slug)
    if (!p) return 'not-started'
    if (p.teach_session_count > 0) return 'taught'
    if (p.practice_completed_at) return 'practiced'
    if (p.vocab_viewed_at) return 'started'
    return 'not-started'
  }

  return (
    <div className="max-w-lg mx-auto w-full px-4 py-6">
      <h1 className="text-2xl font-bold text-green-800 mb-1">Lessons</h1>
      <p className="text-gray-500 text-sm mb-6">Lecciones</p>

      <div className="space-y-3">
        {ALL_MODULES.map(mod => {
          const status = getStatus(mod.slug)
          return (
            <Link key={mod.slug} href={`/modules/${mod.slug}`}>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {MODULE_EMOJIS[mod.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{mod.titleEn}</p>
                  <p className="text-sm text-gray-500">{mod.titleEs}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{mod.vocab.length} words / palabras</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {status === 'taught' && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Taught ✓</span>}
                  {status === 'practiced' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Done ✓</span>}
                  {status === 'started' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Started</span>}
                  {status === 'not-started' && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Start →</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
