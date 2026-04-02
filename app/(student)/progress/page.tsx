import { getSession } from '@/lib/auth'
import getDb from '@/lib/db'
import { ALL_MODULES } from '@/content/modules'

export default async function ProgressPage() {
  const session = await getSession()
  const db = getDb()

  const moduleProgress = db.prepare('SELECT * FROM module_progress WHERE user_id = ?').all(session!.userId) as Array<{
    module_slug: string; vocab_viewed_at: number | null; practice_completed_at: number | null; teach_session_count: number; practice_score: number | null
  }>
  const vocabProgress = db.prepare('SELECT * FROM vocab_progress WHERE user_id = ?').all(session!.userId) as Array<{
    word_id: string; correct_count: number; incorrect_count: number
  }>
  const teachingSessions = db.prepare('SELECT * FROM teaching_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 10').all(session!.userId) as Array<{
    id: string; module_slug: string; started_at: number; phrases_taught: string; encouragement: string
  }>
  const activityLog = db.prepare('SELECT * FROM activity_log WHERE user_id = ? ORDER BY date DESC LIMIT 7').all(session!.userId) as Array<{
    date: string; activity_type: string; count: number
  }>

  const totalVocab = ALL_MODULES.reduce((sum, m) => sum + m.vocab.length, 0)
  const masteredWords = vocabProgress.filter(v => v.correct_count >= 3).length
  const practicedWords = vocabProgress.length
  const completedModules = moduleProgress.filter(m => m.practice_completed_at).length
  const totalTeachSessions = teachingSessions.length

  // Last 7 days activity
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000)
    const date = d.toISOString().split('T')[0]
    const dayLog = activityLog.filter(a => a.date === date)
    const total = dayLog.reduce((s, a) => s + a.count, 0)
    const day = d.toLocaleDateString('en', { weekday: 'short' })
    return { date, day, total }
  }).reverse()

  const maxActivity = Math.max(...last7.map(d => d.total), 1)

  return (
    <div className="max-w-lg mx-auto w-full px-4 py-6">
      <h1 className="text-2xl font-bold text-green-800 mb-1">Progress</h1>
      <p className="text-gray-500 text-sm mb-6">Tu progreso</p>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-green-700">{completedModules}/{ALL_MODULES.length}</p>
          <p className="text-sm text-gray-600 mt-0.5">Lessons completed</p>
          <p className="text-xs text-gray-400">Lecciones</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-blue-600">{masteredWords}/{totalVocab}</p>
          <p className="text-sm text-gray-600 mt-0.5">Words mastered</p>
          <p className="text-xs text-gray-400">Palabras dominadas</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-purple-600">{totalTeachSessions}</p>
          <p className="text-sm text-gray-600 mt-0.5">Teaching sessions</p>
          <p className="text-xs text-gray-400">Sesiones de enseñanza</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-orange-500">{practicedWords}</p>
          <p className="text-sm text-gray-600 mt-0.5">Words practiced</p>
          <p className="text-xs text-gray-400">Palabras practicadas</p>
        </div>
      </div>

      {/* Activity this week */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-700 mb-3">This week / Esta semana</h3>
        <div className="flex items-end gap-2 h-16">
          {last7.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-green-500 rounded-t-lg transition-all"
                style={{ height: `${(day.total / maxActivity) * 100}%`, minHeight: day.total > 0 ? '4px' : '0' }}
              />
              <span className="text-xs text-gray-400">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Module Progress */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-700 mb-3">Lessons / Lecciones</h3>
        <div className="space-y-3">
          {ALL_MODULES.map(mod => {
            const p = moduleProgress.find(mp => mp.module_slug === mod.slug)
            const steps = [!!p?.vocab_viewed_at, !!p?.practice_completed_at, (p?.teach_session_count ?? 0) > 0]
            const completed = steps.filter(Boolean).length
            const pct = Math.round((completed / 3) * 100)
            return (
              <div key={mod.slug} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-gray-700">{mod.titleEn}</p>
                  <span className="text-sm text-gray-400">{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p?.vocab_viewed_at ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>Vocab</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p?.practice_completed_at ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>Quiz {p?.practice_score ? `${p.practice_score}%` : ''}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${(p?.teach_session_count ?? 0) > 0 ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>🎓 Taught</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Teaching Sessions */}
      {teachingSessions.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-700 mb-3">Teaching Sessions / Sesiones de enseñanza</h3>
          <div className="space-y-3">
            {teachingSessions.slice(0, 3).map(session => {
              const mod = ALL_MODULES.find(m => m.slug === session.module_slug)
              const phrases = JSON.parse(session.phrases_taught) as string[]
              return (
                <div key={session.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="font-medium text-gray-700">🎓 {mod?.titleEn || session.module_slug}</p>
                  <p className="text-xs text-gray-400 mb-2">{new Date(session.started_at).toLocaleDateString()}</p>
                  {phrases.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {phrases.slice(0, 3).map((p, i) => (
                        <span key={i} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
