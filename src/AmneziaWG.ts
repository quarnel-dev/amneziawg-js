import { execFileAsync, execWithInput } from './utils/exec.util.js'

import type { AmneziaWGOptions, KeyPair } from './types/index.js'

export class AmneziaWG {
  readonly interface: string
  readonly awgPath?: string | undefined

  constructor(options: AmneziaWGOptions) {
    this.interface = options.interface
    this.awgPath = options.awgPath
  }

  private async runAwg(args: string[]): Promise<string> {
    const { stdout } = await execFileAsync(this.awgPath ?? 'awg', args)
    return stdout
  }

  private async runAwgWithInput(args: string[], input: string): Promise<string> {
    return execWithInput(this.awgPath ?? 'awg', args, input)
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
    const privateKey = (await this.runAwg(['genkey'])).trim()
    const publicKey = (await this.runAwgWithInput(['pubkey'], privateKey)).trim()
    return { privateKey, publicKey }
  }

  async generatePresharedKey(): Promise<string> {
    const key = await this.runAwg(['genpsk'])
    return key.trim()
  }
}
