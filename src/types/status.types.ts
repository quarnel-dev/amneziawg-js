import type { ObfuscationParams } from './obfuscation.types.js'

export interface PeerTransfer {
  rxBytes: bigint
  txBytes: bigint
}

export interface PeerStatus {
  publicKey: string
  presharedKey?: string
  endpoint?: string
  allowedIps: string[]
  latestHandshake: Date | null
  transfer: PeerTransfer
  persistentKeepalive?: number
}

export interface InterfaceStatus {
  interface: string
  publicKey: string
  listeningPort: number
  obfuscation: Required<ObfuscationParams>
  peers: PeerStatus[]
}
