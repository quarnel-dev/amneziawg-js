export class AmneziaWGError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AmneziaWGError'
  }
}
