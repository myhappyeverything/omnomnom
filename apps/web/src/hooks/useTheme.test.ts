import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTheme } from './useTheme'

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    mockMatchMedia(false)
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('defaults to "system" when nothing is stored', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
  })

  it('reads a previously stored theme on mount', () => {
    localStorage.setItem('omnomnom:theme', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('falls back to "system" for an invalid stored value', () => {
    localStorage.setItem('omnomnom:theme', 'not-a-real-theme')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
  })

  it('persists to localStorage under the omnomnom:theme key and updates state', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('omnomnom:theme')).toBe('dark')
  })

  it('applies the dark class to the document element when set to dark', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => {
      result.current.setTheme('light')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
