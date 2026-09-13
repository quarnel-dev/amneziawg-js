import { execFileAsync } from './utils/exec.util.js'

import type { AmneziaWGOptions } from './types/index.js'

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

  async isInstalled(): Promise<boolean> {
    try {
      await this.runAwg(['--version'])
      return true
    } catch {
      return false
    }
  }
}
