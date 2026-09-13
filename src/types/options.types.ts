export interface AmneziaWGOptions {
  interface: string
  awgPath?: string
}

export interface AddPeerOptions {
  publicKey: string
  presharedKey?: string
  allowedIps: string[]
  endpoint?: string
  persistentKeepalive?: number
}
