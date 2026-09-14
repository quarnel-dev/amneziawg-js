import { AmneziaWGError } from './AmneziaWGError.error.js'

export class PeerAlreadyExistsError extends AmneziaWGError {
  readonly publicKey: string

  constructor(publicKey: string) {
    super(`Peer with public key "${publicKey}" already exists`)
    this.name = 'PeerAlreadyExistsError'
    this.publicKey = publicKey
  }
}
