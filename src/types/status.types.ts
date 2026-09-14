import type { ObfuscationParams } from './obfuscation.types.js'

export interface SignaturePackets {
  i1: string | null
  i2: string | null
  i3: string | null
  i4: string | null
  i5: string | null
}

export interface InterfaceTimings {
  contentPaddingAddition: number
  rekeyAfterTime: number
  rekeyTimeout: number
  rejectAfterTime: number
  keepaliveTimeout: number
  maxHandshakeAttempts: number
}

export interface InterfaceStatus {
  interface: string
  privateKey: string
  publicKey: string
  listeningPort: number
  fwmark: string | null
  obfuscation: ObfuscationParams
  signaturePackets: SignaturePackets
  timings: InterfaceTimings
  randomTrailers: boolean
  disableCookies: boolean
  peers: PeerStatus[]
}

export interface PeerTransfer {
  rxBytes: bigint
  txBytes: bigint
}

export interface PeerStatus {
  publicKey: string
  presharedKey: string | null
  endpoint: string | null
  allowedIps: string[]
  latestHandshake: Date | null
  transfer: PeerTransfer
  persistentKeepalive: number | null
}
