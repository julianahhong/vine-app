import { NextRequest, NextResponse } from 'next/server'
import getDb from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()
  const row = db.prepare('SELECT * FROM math_progress WHERE user_id = ?').get(session.userId) as {
    skill_mastery: string
    current_skill: string | null
    diagnostic_done: number
    total_problems: number
    total_correct: number
    mistake_profile: string
    skill_attempt_counts: string
  } | undefined

  if (!row) {
    return NextResponse.json({
      skill_mastery: {},
      current_skill: null,
      diagnostic_done: false,
      total_problems: 0,
      total_correct: 0,
      mistake_profile: { carry_error: 0, borrow_error: 0, arithmetic_fact_error: 0, sign_error: 0 },
      skill_attempt_counts: {},
    })
  }

  return NextResponse.json({
    skill_mastery: JSON.parse(row.skill_mastery),
    current_skill: row.current_skill,
    diagnostic_done: row.diagnostic_done === 1,
    total_problems: row.total_problems,
    total_correct: row.total_correct,
    mistake_profile: JSON.parse(row.mistake_profile),
    skill_attempt_counts: JSON.parse(row.skill_attempt_counts),
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const db = getDb()

  db.prepare(`
    INSERT INTO math_progress (user_id, skill_mastery, current_skill, diagnostic_done, total_problems, total_correct, mistake_profile, skill_attempt_counts, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      skill_mastery = excluded.skill_mastery,
      current_skill = excluded.current_skill,
      diagnostic_done = excluded.diagnostic_done,
      total_problems = excluded.total_problems,
      total_correct = excluded.total_correct,
      mistake_profile = excluded.mistake_profile,
      skill_attempt_counts = excluded.skill_attempt_counts,
      updated_at = excluded.updated_at
  `).run(
    session.userId,
    JSON.stringify(body.skill_mastery || {}),
    body.current_skill || null,
    body.diagnostic_done ? 1 : 0,
    body.total_problems || 0,
    body.total_correct || 0,
    JSON.stringify(body.mistake_profile || {}),
    JSON.stringify(body.skill_attempt_counts || {}),
    Date.now(),
  )

  return NextResponse.json({ ok: true })
}
