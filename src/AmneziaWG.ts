import { execFileAsync } from './utils/exec.util.js'

import type { AmneziaWGOptions, KeyPair } from './types/index.js'
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
    const trimed = value.trim()
    if (KEY_RE.test(trimed)) {
      throw new Error(`Invalid ${label}: expected base64-encoded 32-byte key`)
    }
    return trimed
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
    return this.assertKey(await this.runAwg(['genkey']), 'preshared key')
  }
}
