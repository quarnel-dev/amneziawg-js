import { execFileAsync } from './utils/exec.util.js'
import { parseAwgDump } from './utils/parser.util.js'
import { AmneziaWGError, InvalidKeyError, PeerAlreadyExistsError, PeerNotFoundError } from './errors/index.js'

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
      throw new InvalidKeyError(label)
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

  async addPeer(options: AddPeerOptions): Promise<PeerStatus> {
    const peerKey = this.assertKey(options.publicKey, 'peer public key')
    const args = ['set', this.interface, 'peer', peerKey]

    const existing = await this.getPeer(peerKey)
    if (existing) throw new PeerAlreadyExistsError(peerKey)

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

    if (options.advancedSecurity !== undefined) {
      args.push('advanced-security', options.advancedSecurity)
    }

    await this.runAwg(args)

    const created = await this.getPeer(peerKey)
    if (!created) throw new AmneziaWGError('Peer was added but could not be found afterwards')

    return created
  }

  async removePeer(publicKey: string): Promise<void> {
    const peerKey = this.assertKey(publicKey, 'peer public key')

    const existing = await this.getPeer(peerKey)
    if (!existing) throw new PeerNotFoundError(peerKey)

    await this.runAwg(['set', this.interface, 'peer', peerKey, 'remove'])
  }
}
