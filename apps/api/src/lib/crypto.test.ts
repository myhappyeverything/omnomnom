import { describe, expect, it } from 'vitest'
import { generateOpaqueToken, hashPassword, sha256Hex, verifyPassword } from './crypto.js'

describe('hashPassword / verifyPassword', () => {
  it('produces a different salt and hash each time, even for the same password', async () => {
    const first = await hashPassword('correct horse battery staple')
    const second = await hashPassword('correct horse battery staple')

    expect(first.salt).not.toBe(second.salt)
    expect(first.hash).not.toBe(second.hash)
  })

  it('verifies successfully against the correct password', async () => {
    const stored = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('correct horse battery staple', stored)).toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const stored = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('wrong password', stored)).toBe(false)
  })

  it('rejects a password verified against another password’s hash', async () => {
    const a = await hashPassword('password-a')
    const b = await hashPassword('password-b')
    expect(await verifyPassword('password-a', b)).toBe(false)
    expect(await verifyPassword('password-b', a)).toBe(false)
  })

  it('is sensitive to even a single-character difference', async () => {
    const stored = await hashPassword('password1')
    expect(await verifyPassword('password2', stored)).toBe(false)
  })
}, 20_000)

describe('sha256Hex', () => {
  it('is deterministic for the same input', async () => {
    expect(await sha256Hex('hello')).toBe(await sha256Hex('hello'))
  })

  it('produces different digests for different inputs', async () => {
    expect(await sha256Hex('hello')).not.toBe(await sha256Hex('world'))
  })

  it('produces a 64-character lowercase hex string', async () => {
    const digest = await sha256Hex('hello')
    expect(digest).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('generateOpaqueToken', () => {
  it('generates distinct, URL-safe tokens', () => {
    const a = generateOpaqueToken()
    const b = generateOpaqueToken()
    expect(a).not.toBe(b)
    expect(a).not.toMatch(/[+/=]/)
    expect(a.length).toBeGreaterThan(30)
  })
})
