import { NextRequest, NextResponse } from 'next/server'
import getDb from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()
  const sessions = db.prepare(
    'SELECT * FROM math_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 30'
  ).all(session.userId)

  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const db = getDb()

  db.prepare(`
    INSERT OR IGNORE INTO math_sessions (id, user_id, session_type, started_at, ended_at, total_problems, correct, accuracy, current_skill)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.id,
    session.userId,
    body.session_type,
    body.started_at,
    body.ended_at,
    body.total_problems,
    body.correct,
    body.accuracy,
    body.current_skill || '',
  )

  return NextResponse.json({ ok: true })
}
