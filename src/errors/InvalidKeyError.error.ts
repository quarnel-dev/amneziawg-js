import { AmneziaWGError } from './AmneziaWGError.error.js'

export class InvalidKeyError extends AmneziaWGError {
  readonly label: string

  constructor(label: string) {
    super(`Invalid ${label}: expected base64-encoded 32-byte key`)
    this.name = 'InvalidKeyError'
    this.label = label
  }
}
