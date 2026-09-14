import { AmneziaWGError } from './AmneziaWGError.error.js'

export class ExecError extends AmneziaWGError {
  readonly command: string
  readonly args: readonly string[]
  readonly exitCode: number | null
  readonly stdout: string
  readonly stderr: string

  constructor(params: {
    command: string
    args: readonly string[]
    exitCode: number | null
    stdout: string
    stderr: string
    cause?: unknown
  }) {
    const { command, args, exitCode, stdout, stderr, cause } = params
    const label = `${command} ${args.join(' ')}`.trim()
    const reason = stderr.trim() || 'unknown error'

    super(exitCode === null ? `${label} failed: ${reason}` : `${label} exited with code ${exitCode}: ${reason}`)

    this.name = 'ExecError'
    this.command = command
    this.args = args
    this.exitCode = exitCode
    this.stdout = stdout
    this.stderr = stderr

    if (cause !== undefined) {
      ;(this as { cause?: unknown }).cause = cause
    }
  }
}
