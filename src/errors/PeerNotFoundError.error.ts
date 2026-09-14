import { AmneziaWGError } from './AmneziaWGError.error.js'

export class PeerNotFoundError extends AmneziaWGError {
  readonly publicKey: string

  constructor(publicKey: string) {
    super(`Peer with public key "${publicKey}" was not found`)
    this.name = 'PeerNotFoundError'
    this.publicKey = publicKey
  }
}
