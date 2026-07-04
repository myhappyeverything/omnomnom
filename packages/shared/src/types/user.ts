import type { Sex } from '../constants.js'

/** User fields safe to send to the client — never includes password hash/salt. */
export interface PublicUser {
  id: string
  name: string
  email: string
  dateOfBirth: string
  sex: Sex
  heightCm: number
  createdAt: string
  updatedAt: string
}
