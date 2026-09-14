import { execFile, spawn, type ExecFileOptions } from 'node:child_process'
import { promisify } from 'node:util'

import { ExecError } from '../errors/ExecError.error.js'
import { DEFAULT_MAX_BUFFER_BYTES, DEFAULT_TIMEOUT_MS } from './exec.constants.js'

import type { ExecOptions, ExecResult } from '../types/exec.types.js'

type ExecFileOptionsWithInput = ExecFileOptions & { input?: string }

const execFileAsyncRaw = promisify(execFile)

export async function execFileAsync(command: string, args: readonly string[], options: ExecOptions = {}): Promise<ExecResult> {
  if (options.input !== undefined) {
    return spawnWithInput(command, args, options.input, options)
  }
  return execWithoutInput(command, args, options)
}

async function execWithoutInput(command: string, args: readonly string[], options: ExecOptions): Promise<ExecResult> {
  const execOptions: ExecFileOptionsWithInput = {
    timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxBuffer: options.maxBufferBytes ?? DEFAULT_MAX_BUFFER_BYTES,
    windowsHide: true,
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

function spawnWithInput(command: string, args: readonly string[], input: string, options: ExecOptions): Promise<ExecResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxBufferBytes = options.maxBufferBytes ?? DEFAULT_MAX_BUFFER_BYTES

  return new Promise<ExecResult>((resolve, reject) => {
    const child = spawn(command, [...args], { windowsHide: true })
    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      fn()
    }

    const failWith = (cause: unknown, exitCode: number | null = null) => {
      finish(() =>
        reject(
          new ExecError({
            command,
            args,
            exitCode,
            stdout,
            stderr,
            cause,
          })
        )
      )
    }

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      failWith(new Error(`timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    const checkBuffer = () => {
      if (stdout.length + stderr.length > maxBufferBytes) {
        child.kill('SIGTERM')
        failWith(new Error(`maxBuffer exceeded (${maxBufferBytes} bytes)`))
      }
    }

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
      checkBuffer()
    })

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
      checkBuffer()
    })

    child.on('error', (err) => {
      failWith(err)
    })

    child.on('close', (code) => {
      finish(() => {
        if (code === 0) {
          resolve({ stdout, stderr })
        } else {
          reject(
            new ExecError({
              command,
              args,
              exitCode: code,
              stdout,
              stderr,
            })
          )
        }
      })
    })

    child.stdin.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code !== 'EPIPE') {
        failWith(err)
      }
    })

    child.stdin.write(input)
    child.stdin.end()
  })
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
