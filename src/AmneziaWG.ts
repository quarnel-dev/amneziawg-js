import { execFileAsync } from './utils/exec.util.js'
import { parseAwgDump } from './utils/parser.utils.js'

import type { AmneziaWGOptions, KeyPair, InterfaceStatus, PeerStatus } from './types/index.js'
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
    return parseAwgDump(dump)
  }

  async getPeers(): Promise<PeerStatus[]> {
    const status = await this.getStatus()
    return status.peers
  }

  async getPeer(publicKey: string): Promise<PeerStatus | null> {
    const status = await this.getStatus()
    return status.peers.find((peer) => peer.publicKey === publicKey) ?? null
  }
}
