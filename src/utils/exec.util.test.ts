import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { promisify } from 'node:util'
import { EventEmitter } from 'node:events'

const execFileCustomImpl = vi.fn()

vi.mock('node:child_process', async () => {
  const { promisify } = await import('node:util')
  const execFileMock = vi.fn() as unknown as {
    (...args: unknown[]): unknown
    [key: symbol]: unknown
  }
  execFileMock[promisify.custom] = (...args: unknown[]) => execFileCustomImpl(...args)

  return {
    execFile: execFileMock,
    spawn: vi.fn(),
  }
})

const { execFile, spawn } = await import('node:child_process')
const { execFileAsync } = await import('./exec.util.js')
const { ExecError } = await import('../errors/ExecError.error.js')

class FakeStdin extends EventEmitter {
  write = vi.fn()
  end = vi.fn()
}

class FakeChildProcess extends EventEmitter {
  stdout = new EventEmitter()
  stderr = new EventEmitter()
  stdin = new FakeStdin()
  kill = vi.fn()
}

describe('execFileAsync (without input, uses execFile)', () => {
  beforeEach(() => {
    execFileCustomImpl.mockReset()
  })

  it('resolves with stdout/stderr on success', async () => {
    execFileCustomImpl.mockResolvedValue({ stdout: 'ok output', stderr: '' })

    const result = await execFileAsync('awg', ['show'])

    expect(result).toEqual({ stdout: 'ok output', stderr: '' })
    expect(execFileCustomImpl).toHaveBeenCalledWith(
      'awg',
      ['show'],
      expect.objectContaining({ windowsHide: true })
    )
  })

  it('wraps a failure into ExecError with exitCode/stdout/stderr', async () => {
    execFileCustomImpl.mockRejectedValue(
      Object.assign(new Error('boom'), { code: 1, stdout: 'partial out', stderr: 'some stderr' })
    )

    await expect(execFileAsync('awg', ['bad'])).rejects.toMatchObject({
      name: 'ExecError',
      exitCode: 1,
      stdout: 'partial out',
      stderr: 'some stderr',
    })
  })

  it('rejects with ExecError instance (not just shape)', async () => {
    execFileCustomImpl.mockRejectedValue(Object.assign(new Error('boom'), { code: 1 }))
    await expect(execFileAsync('awg', ['bad'])).rejects.toBeInstanceOf(ExecError)
  })
})

describe('execFileAsync (with input, uses spawn)', () => {
  let fakeChild: FakeChildProcess

  beforeEach(() => {
    fakeChild = new FakeChildProcess()
    ;(spawn as unknown as ReturnType<typeof vi.fn>).mockReset().mockReturnValue(fakeChild)
  })

  it('writes input to stdin and resolves on close(0)', async () => {
    const promise = execFileAsync('awg', ['setconf', 'awg0'], { input: 'peer config' })

    fakeChild.stdout.emit('data', Buffer.from('added\n'))
    fakeChild.emit('close', 0)

    const result = await promise
    expect(result).toEqual({ stdout: 'added\n', stderr: '' })
    expect(fakeChild.stdin.write).toHaveBeenCalledWith('peer config')
    expect(fakeChild.stdin.end).toHaveBeenCalled()
  })

  it('rejects with ExecError when process exits with non-zero code', async () => {
    const promise = execFileAsync('awg', ['setconf', 'awg0'], { input: 'bad config' })

    fakeChild.stderr.emit('data', Buffer.from('invalid config'))
    fakeChild.emit('close', 1)

    await expect(promise).rejects.toMatchObject({
      name: 'ExecError',
      exitCode: 1,
      stderr: 'invalid config',
    })
  })

  it('rejects with ExecError on child "error" event (e.g. spawn failure)', async () => {
    const promise = execFileAsync('awg', ['setconf', 'awg0'], { input: 'x' })

    fakeChild.emit('error', new Error('ENOENT'))

    await expect(promise).rejects.toMatchObject({ name: 'ExecError', exitCode: null })
  })

  it('kills the child and rejects when maxBuffer is exceeded', async () => {
    const promise = execFileAsync('awg', ['setconf', 'awg0'], {
      input: 'x',
      maxBufferBytes: 5,
    })

    fakeChild.stdout.emit('data', Buffer.from('this is way more than 5 bytes'))

    await expect(promise).rejects.toMatchObject({ name: 'ExecError' })
    expect(fakeChild.kill).toHaveBeenCalledWith('SIGTERM')
  })

  it('ignores EPIPE errors on stdin', async () => {
    const promise = execFileAsync('awg', ['setconf', 'awg0'], { input: 'x' })

    const epipe = Object.assign(new Error('EPIPE'), { code: 'EPIPE' })
    fakeChild.stdin.emit('error', epipe)
    fakeChild.emit('close', 0)

    await expect(promise).resolves.toEqual({ stdout: '', stderr: '' })
  })
})

describe('execFileAsync (with input, timeout handling)', () => {
  let fakeChild: FakeChildProcess

  beforeEach(() => {
    vi.useFakeTimers()
    fakeChild = new FakeChildProcess()
    ;(spawn as unknown as ReturnType<typeof vi.fn>).mockReset().mockReturnValue(fakeChild)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('kills the child and rejects with ExecError after timeoutMs elapses', async () => {
    const promise = execFileAsync('awg', ['setconf', 'awg0'], {
      input: 'x',
      timeoutMs: 1000,
    })

    promise.catch(() => {})

    await vi.advanceTimersByTimeAsync(1000)

    expect(fakeChild.kill).toHaveBeenCalledWith('SIGTERM')
    await expect(promise).rejects.toMatchObject({ name: 'ExecError' })
  })
})