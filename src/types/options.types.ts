export interface AmneziaWGOptions {
  interface: string
  awgPath?: string
}

export interface AddPeerOptions {
  publicKey: string
  presharedKey?: string | null
  endpoint?: string
  persistentKeepalive?: number | 'off'
  allowedIps?: string[]
  jc?: number
  jmin?: number
  jmax?: number
}
