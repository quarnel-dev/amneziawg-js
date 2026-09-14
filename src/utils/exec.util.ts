import { execFile, type ExecFileOptions } from 'node:child_process'
import { promisify } from 'node:util'

import { ExecError } from '../errors/ExecError.error.js'
import { DEFAULT_MAX_BUFFER_BYTES, DEFAULT_TIMEOUT_MS } from './exec.constants.js'

import type { ExecOptions, ExecResult } from '../types/exec.types.js'

type ExecFileOptionsWithInput = ExecFileOptions & { input?: string }

const execFileAsyncRaw = promisify(execFile)

export async function execFileAsync(command: string, args: readonly string[], options: ExecOptions = {}): Promise<ExecResult> {
  const execOptions: ExecFileOptionsWithInput = {
    timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxBuffer: options.maxBufferBytes ?? DEFAULT_MAX_BUFFER_BYTES,
    windowsHide: true
  }
  if (options.input !== undefined) {
    execOptions.input = options.input
  }

  try {
    const { stdout, stderr } = await execFileAsyncRaw(command, [...args], execOptions)
    return {
      stdout: bufferToString(stdout),
      stderr: bufferToString(stderr),
    }
  } catch (err) {
    throw toExecError(command, args, err)
  }
}

function toExecError(command: string, args: readonly string[], err: unknown): ExecError {
  const e = err as {
    code?: number | string
    stdout?: string | Buffer
    stderr?: string | Buffer
  }
  const exitCode = typeof e.code === 'number' ? e.code : null
  return new ExecError({
    command,
    args,
    exitCode,
    stdout: bufferToString(e.stdout),
    stderr: bufferToString(e.stderr),
    cause: err,
  })
}

function bufferToString(value: string | Buffer | undefined): string {
  if (value === undefined) return ''
  return typeof value === 'string' ? value : value.toString('utf8')
}
