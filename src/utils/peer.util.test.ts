import { describe, it, expect } from 'vitest'
import { isPeerActive, DEFAULT_ACTIVE_THRESHOLD_SECONDS } from './peer.util.js'

describe('isPeerActive', () => {
  it('has DEFAULT_ACTIVE_THRESHOLD_SECONDS set to 180 seconds', () => {
    expect(DEFAULT_ACTIVE_THRESHOLD_SECONDS).toBe(180)
  })

  it('returns false when latestHandshake is null', () => {
    expect(isPeerActive({ latestHandshake: null })).toBe(false)
  })

  it('returns true when handshake happened just now', () => {
    const now = new Date('2026-10-07T12:00:00Z')
    const latestHandshake = new Date('2026-10-07T12:00:00Z')
    expect(isPeerActive({ latestHandshake }, 180, now)).toBe(true)
  })

  it('returns true when handshake is within default threshold (60 seconds ago)', () => {
    const now = new Date('2026-10-07T12:01:00Z')
    const latestHandshake = new Date('2026-10-07T12:00:00Z')
    expect(isPeerActive({ latestHandshake }, DEFAULT_ACTIVE_THRESHOLD_SECONDS, now)).toBe(true)
  })

  it('returns true exactly at the threshold limit', () => {
    const now = new Date('2026-10-07T12:03:00Z')
    const latestHandshake = new Date('2026-10-07T12:00:00Z') // 180 seconds diff
    expect(isPeerActive({ latestHandshake }, 180, now)).toBe(true)
  })

  it('returns false when handshake is older than threshold (181 seconds ago)', () => {
    const now = new Date('2026-10-07T12:03:01Z')
    const latestHandshake = new Date('2026-10-07T12:00:00Z') // 181 seconds diff
    expect(isPeerActive({ latestHandshake }, 180, now)).toBe(false)
  })

  it('supports custom threshold', () => {
    const now = new Date('2026-10-07T12:01:00Z')
    const latestHandshake = new Date('2026-10-07T12:00:00Z') // 60 seconds diff
    expect(isPeerActive({ latestHandshake }, 30, now)).toBe(false)
    expect(isPeerActive({ latestHandshake }, 90, now)).toBe(true)
  })

  it('returns false when handshake is in the future relative to now', () => {
    const now = new Date('2026-10-07T12:00:00Z')
    const latestHandshake = new Date('2026-10-07T12:01:00Z')
    expect(isPeerActive({ latestHandshake }, 180, now)).toBe(false)
  })

  it('uses current system time when now is omitted', () => {
    const justNow = new Date()
    expect(isPeerActive({ latestHandshake: justNow })).toBe(true)

    const veryOld = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
    expect(isPeerActive({ latestHandshake: veryOld })).toBe(false)
  })
})
