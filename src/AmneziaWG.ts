import { execFileAsync } from './utils/exec.util.js'
import { parseAwgDump } from './utils/parser.utils.js'

import type { AmneziaWGOptions, KeyPair, InterfaceStatus, PeerStatus, AddPeerOptions } from './types/index.js'
import type { ExecOptions } from './types/exec.types.js'

const KEY_RE = /^[A-Za-z0-9+/]{43}=$/

export class AmneziaWG {
  readonly interface: string
  readonly awgPath?: string | undefined

  constructor(options: AmneziaWGOptions) {
    this.interface = options.interface
    this.awgPath = options.awgPath
  }

  private async runAwg(args: string[], options: ExecOptions = {}): Promise<string> {
    const { stdout } = await execFileAsync(this.awgPath ?? 'awg', args, options)
    return stdout
  }

  private assertKey(value: string, label: string): string {
    const trimmed = value.trim()
    if (!KEY_RE.test(trimmed)) {
      throw new Error(`Invalid ${label}: expected base64-encoded 32-byte key`)
    }
    return trimmed
  }

  async isInstalled(): Promise<boolean> {
    try {
      await this.runAwg(['--version'])
      return true
    } catch {
      return false
    }
  }

  async generateKeys(): Promise<KeyPair> {
    const privateKey = this.assertKey(await this.runAwg(['genkey']), 'private key')
    const publicKey = this.assertKey(await this.runAwg(['pubkey'], { input: `${privateKey}\n` }), 'public key')
    return { privateKey, publicKey }
  }

  async generatePresharedKey(): Promise<string> {
    return this.assertKey(await this.runAwg(['genpsk']), 'preshared key')
  }

  async getStatus(): Promise<InterfaceStatus> {
    const dump = await this.runAwg(['show', this.interface, 'dump'])
    return parseAwgDump(dump, this.interface)
  }

  async getPeers(): Promise<PeerStatus[]> {
    const status = await this.getStatus()
    return status.peers
  }

  async getPeer(publicKey: string): Promise<PeerStatus | null> {
    const status = await this.getStatus()
    return status.peers.find((peer) => peer.publicKey === publicKey) ?? null
  }

  async addPeer(options: AddPeerOptions): Promise<void> {
    const peerKey = this.assertKey(options.publicKey, 'peer public key')
    const args = ['set', this.interface, 'peer', peerKey]

    if (options.presharedKey !== undefined) {
      args.push('preshared-key', options.presharedKey === null ? 'none' : this.assertKey(options.presharedKey, 'preshared key'))
    }

    if (options.endpoint) {
      args.push('endpoint', options.endpoint)
    }

    if (options.persistentKeepalive !== undefined) {
      args.push('persistent-keepalive', String(options.persistentKeepalive))
    }

    if (options.allowedIps) {
      args.push('allowed-ips', options.allowedIps.length === 0 ? 'none' : options.allowedIps.join(','))
    }

    const hasJunkParams = options.jc !== undefined || options.jmin !== undefined || options.jmax !== undefined

    if (hasJunkParams) {
      args.push('advanced-security', 'on')
      if (options.jc !== undefined) args.push('jc', String(options.jc))
      if (options.jmin !== undefined) args.push('jmin', String(options.jmin))
      if (options.jmax !== undefined) args.push('jmax', String(options.jmax))
    }

    await this.runAwg(args)
  }

  async removePeer(publicKey: string): Promise<void> {
    const peerKey = this.assertKey(publicKey, 'peer public key')
    await this.runAwg(['set', this.interface, 'peer', peerKey, 'remove'])
  }
}
