import type { Env } from './env.js'

export interface Variables {
  userId: string
}

export type AppEnv = { Bindings: Env; Variables: Variables }
