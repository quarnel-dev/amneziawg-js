import type { PeerStatus } from '../types/status.types.js'

export const DEFAULT_ACTIVE_THRESHOLD_SECONDS = 180

export function isPeerActive(
  peer: Pick<PeerStatus, 'latestHandshake'>,
  thresholdSeconds: number = DEFAULT_ACTIVE_THRESHOLD_SECONDS,
  now: Date = new Date()
): boolean {
  if (!peer.latestHandshake) return false

  const diffMs = now.getTime() - peer.latestHandshake.getTime()
  return diffMs >= 0 && diffMs <= thresholdSeconds * 1000
}
