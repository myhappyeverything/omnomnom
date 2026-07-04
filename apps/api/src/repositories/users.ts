import type { Env } from '../types/env.js'
import type { UserRow } from '../types/models.js'
import { newId, nowIso } from '../lib/db.js'

export interface NewUserInput {
  name: string
  email: string
  passwordHash: string
  passwordSalt: string
  passwordIterations: number
  dateOfBirth: string
  sex: 'male' | 'female'
  heightCm: number
}

export async function countUsers(env: Env): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>()
  return row?.count ?? 0
}

export async function findUserByEmail(env: Env, email: string): Promise<UserRow | null> {
  return env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>()
}

export async function findUserById(env: Env, id: string): Promise<UserRow | null> {
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>()
}

export async function createUser(env: Env, input: NewUserInput): Promise<UserRow> {
  const id = newId()
  const timestamp = nowIso()
  await env.DB.prepare(
    `INSERT INTO users
      (id, name, email, password_hash, password_salt, password_iterations, date_of_birth, sex, height_cm, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      input.name,
      input.email,
      input.passwordHash,
      input.passwordSalt,
      input.passwordIterations,
      input.dateOfBirth,
      input.sex,
      input.heightCm,
      timestamp,
      timestamp,
    )
    .run()

  // Every user gets default settings + notification rows at creation time so
  // the rest of the app never has to null-check a missing 1:1 row.
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO settings (user_id, unit_system, theme, updated_at) VALUES (?, 'metric', 'system', ?)`,
    ).bind(id, timestamp),
    env.DB.prepare(
      `INSERT INTO notification_settings (user_id, weigh_in_reminder_days, timezone, updated_at)
       VALUES (?, '[]', 'UTC', ?)`,
    ).bind(id, timestamp),
  ])

  const user = await findUserById(env, id)
  if (!user) throw new Error('Failed to create user')
  return user
}
