export interface ExecOptions {
  input?: string
  timeoutMs?: number
  maxBufferBytes?: number
}

export interface ExecResult {
  stdout: string
  stderr: string
}
