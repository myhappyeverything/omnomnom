import { timingSafeEqual } from 'node:crypto'

// bcrypt/argon2 aren't available in the Workers runtime; PBKDF2-HMAC-SHA256 via
// Web Crypto is the standard substitute. The 2023 OWASP Password Storage
// Cheat Sheet recommends 600,000 iterations for this algorithm, but the real
// (non-Miniflare) Workers runtime hard-caps crypto.subtle's PBKDF2 at 100,000
// — anything higher throws `NotSupportedError` at request time. This only
// surfaces in production; Miniflare's local/test emulation doesn't enforce
// the limit, so 600,000 passed every local and CI test run before failing
// against the real deployed Worker. 100,000 is the highest value the
// platform allows.
export const DEFAULT_PBKDF2_ITERATIONS = 100_000
const DERIVED_KEY_LENGTH_BITS = 256

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function generateSaltHex(): string {
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  return toHex(salt.buffer)
}

async function derivePbkdf2(
  password: string,
  saltHex: string,
  iterations: number,
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromHex(saltHex),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    DERIVED_KEY_LENGTH_BITS,
  )
  return toHex(derived)
}

export interface PasswordHash {
  hash: string
  salt: string
  iterations: number
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = generateSaltHex()
  const iterations = DEFAULT_PBKDF2_ITERATIONS
  const hash = await derivePbkdf2(password, salt, iterations)
  return { hash, salt, iterations }
}

export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  const candidate = await derivePbkdf2(password, stored.salt, stored.iterations)
  const candidateBytes = fromHex(candidate)
  const storedBytes = fromHex(stored.hash)
  if (candidateBytes.length !== storedBytes.length) return false
  return timingSafeEqual(candidateBytes, storedBytes)
}

/** SHA-256 hex digest — used to store refresh tokens at rest without keeping the raw secret. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return toHex(digest)
}

/** SHA-256 hex digest of raw bytes — used to content-address uploaded meal photos. */
export async function sha256HexFromBytes(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return toHex(digest)
}

/** Cryptographically random, URL-safe opaque token (32 bytes of entropy). */
export function generateOpaqueToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
