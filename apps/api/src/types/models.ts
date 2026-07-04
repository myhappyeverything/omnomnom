import type { Sex } from '@purple/shared'

/** Raw D1 `users` row shape (snake_case, matches the schema exactly). */
export interface UserRow {
  id: string
  name: string
  email: string
  password_hash: string
  password_salt: string
  password_iterations: number
  date_of_birth: string
  sex: Sex
  height_cm: number
  created_at: string
  updated_at: string
}

export interface RefreshTokenRow {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  revoked_at: string | null
  created_at: string
}
