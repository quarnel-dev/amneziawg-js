import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./utils/exec.util.js', () => ({
  execFileAsync: vi.fn(),
}))

const { execFileAsync } = await import('./utils/exec.util.js')
const { AmneziaWG } = await import('./AmneziaWG.js')
const { InvalidKeyError, PeerAlreadyExistsError, PeerNotFoundError, AmneziaWGError } = await import('./errors/index.js')

const execFileAsyncMock = execFileAsync as unknown as ReturnType<typeof vi.fn>

const VALID_PRIVATE_KEY = 'MENZwC2GFlXO4H1HLNkfimgGIQzVRx+/Hk1MOy6qJkU='
const VALID_PUBLIC_KEY = 'gNXUdWkuXTdGIsefw1c9/u3WuR/W5lKTgARCDxMoj3s='
const VALID_PEER_KEY = '0w5ovtxVw1rtngkzYctBYTHiszP6nYAmlGwpYJNELRE='
const VALID_PRESHARED_KEY = '58JudYcFloLpplF8qBNjUATQYxi6Hk/wJ9YNivDz17g='

function makeInterfaceLine(): string {
  return [
    VALID_PRIVATE_KEY,
    VALID_PUBLIC_KEY,
    '51822',
    '4',
    '40',
    '70', // jc, jmin, jmax
    '0',
    '0',
    '0',
    '0', // s1-s4
    '1',
    '2',
    '3',
    '4', // h1-h4
    '(null)',
    '(null)',
    '(null)',
    '(null)',
    '(null)', // i1-i5
    '(none)', // fwmark
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    'off',
    'off',
    'off',
  ].join('\t')
}

function makePeerLine(publicKey: string): string {
  return [publicKey, '(none)', '(none)', '10.9.0.2/32', '0', '0', '0', 'off'].join('\t')
}

function dumpWithoutPeer(): string {
  return makeInterfaceLine()
}

function dumpWithPeer(publicKey: string = VALID_PEER_KEY): string {
  return `${makeInterfaceLine()}\n${makePeerLine(publicKey)}`
}

function okResult(stdout = '') {
  return { stdout, stderr: '' }
}

describe('AmneziaWG', () => {
  beforeEach(() => {
    execFileAsyncMock.mockReset()
  })

  describe('constructor', () => {
    it('stores the interface name', () => {
      const awg = new AmneziaWG({ interface: 'awg0' })
      expect(awg.interface).toBe('awg0')
    })

    it('uses the custom awgPath as the command when provided', async () => {
      const awg = new AmneziaWG({ interface: 'awg0', awgPath: '/usr/local/bin/awg' })
      execFileAsyncMock.mockResolvedValue(okResult())

      await awg.isInstalled()

      expect(execFileAsyncMock).toHaveBeenCalledWith('/usr/local/bin/awg', ['--version'], {})
    })

    it('defaults the command to "awg" when awgPath is not provided', async () => {
      const awg = new AmneziaWG({ interface: 'awg0' })
      execFileAsyncMock.mockResolvedValue(okResult())

      await awg.isInstalled()

      expect(execFileAsyncMock).toHaveBeenCalledWith('awg', ['--version'], {})
    })
  })

  describe('isInstalled', () => {
    const awg = new AmneziaWG({ interface: 'awg0' })

    it('resolves true when the CLI call succeeds', async () => {
      execFileAsyncMock.mockResolvedValue(okResult('awg 1.0.0'))
      await expect(awg.isInstalled()).resolves.toBe(true)
    })

    it('resolves false when the CLI call throws', async () => {
      execFileAsyncMock.mockRejectedValue(new Error('command not found'))
      await expect(awg.isInstalled()).resolves.toBe(false)
    })
  })

  describe('generateKeys', () => {
    const awg = new AmneziaWG({ interface: 'awg0' })

    it('generates a private/public key pair', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(VALID_PRIVATE_KEY)).mockResolvedValueOnce(okResult(VALID_PUBLIC_KEY))

      const keys = await awg.generateKeys()

      expect(keys).toEqual({ privateKey: VALID_PRIVATE_KEY, publicKey: VALID_PUBLIC_KEY })
    })

    it('trims trailing newlines from CLI output before validating', async () => {
      execFileAsyncMock
        .mockResolvedValueOnce(okResult(`${VALID_PRIVATE_KEY}\n`))
        .mockResolvedValueOnce(okResult(`${VALID_PUBLIC_KEY}\n`))

      const keys = await awg.generateKeys()

      expect(keys).toEqual({ privateKey: VALID_PRIVATE_KEY, publicKey: VALID_PUBLIC_KEY })
    })

    it('pipes the private key into `pubkey` via stdin', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(VALID_PRIVATE_KEY)).mockResolvedValueOnce(okResult(VALID_PUBLIC_KEY))

      await awg.generateKeys()

      expect(execFileAsyncMock).toHaveBeenNthCalledWith(1, 'awg', ['genkey'], {})
      expect(execFileAsyncMock).toHaveBeenNthCalledWith(2, 'awg', ['pubkey'], {
        input: `${VALID_PRIVATE_KEY}\n`,
      })
    })

    it('throws InvalidKeyError when `genkey` returns garbage', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult('not-a-key'))
      await expect(awg.generateKeys()).rejects.toBeInstanceOf(InvalidKeyError)
    })

    it('throws InvalidKeyError when `pubkey` returns garbage', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(VALID_PRIVATE_KEY)).mockResolvedValueOnce(okResult('not-a-key'))
      await expect(awg.generateKeys()).rejects.toBeInstanceOf(InvalidKeyError)
    })
  })

  describe('generatePresharedKey', () => {
    const awg = new AmneziaWG({ interface: 'awg0' })

    it('returns a validated preshared key', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(VALID_PRESHARED_KEY))
      await expect(awg.generatePresharedKey()).resolves.toBe(VALID_PRESHARED_KEY)
      expect(execFileAsyncMock).toHaveBeenCalledWith('awg', ['genpsk'], {})
    })

    it('throws InvalidKeyError on malformed output', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult('garbage'))
      await expect(awg.generatePresharedKey()).rejects.toBeInstanceOf(InvalidKeyError)
    })
  })

  describe('getStatus', () => {
    const awg = new AmneziaWG({ interface: 'awg0' })

    it('runs `show <iface> dump` and parses the result', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(dumpWithPeer()))

      const status = await awg.getStatus()

      expect(execFileAsyncMock).toHaveBeenCalledWith('awg', ['show', 'awg0', 'dump'], {})
      expect(status.interface).toBe('awg0')
      expect(status.publicKey).toBe(VALID_PUBLIC_KEY)
      expect(status.peers).toHaveLength(1)
    })
  })

  describe('getPeers', () => {
    const awg = new AmneziaWG({ interface: 'awg0' })

    it('returns the peers array from status', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(dumpWithPeer()))
      const peers = await awg.getPeers()
      expect(peers).toHaveLength(1)
      expect(peers[0]?.publicKey).toBe(VALID_PEER_KEY)
    })

    it('returns an empty array when the interface has no peers', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(dumpWithoutPeer()))
      await expect(awg.getPeers()).resolves.toEqual([])
    })
  })

  describe('getPeer', () => {
    const awg = new AmneziaWG({ interface: 'awg0' })

    it('finds a peer by public key', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(dumpWithPeer()))
      const peer = await awg.getPeer(VALID_PEER_KEY)
      expect(peer?.publicKey).toBe(VALID_PEER_KEY)
    })

    it('returns null when the peer is not found', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(dumpWithoutPeer()))
      await expect(awg.getPeer(VALID_PEER_KEY)).resolves.toBeNull()
    })
  })

  describe('addPeer', () => {
    const awg = new AmneziaWG({ interface: 'awg0' })

    describe('validation', () => {
      it('throws InvalidKeyError for a malformed public key', async () => {
        await expect(awg.addPeer({ publicKey: 'not-a-key' })).rejects.toBeInstanceOf(InvalidKeyError)
        expect(execFileAsyncMock).not.toHaveBeenCalled()
      })

      it('throws InvalidKeyError for a malformed preshared key', async () => {
        execFileAsyncMock.mockResolvedValueOnce(okResult(dumpWithoutPeer()))
        await expect(awg.addPeer({ publicKey: VALID_PEER_KEY, presharedKey: 'bad-psk' })).rejects.toBeInstanceOf(InvalidKeyError)
      })
    })

    describe('conflict handling', () => {
      it('throws PeerAlreadyExistsError when the peer already exists', async () => {
        execFileAsyncMock.mockResolvedValueOnce(okResult(dumpWithPeer(VALID_PEER_KEY)))

        await expect(awg.addPeer({ publicKey: VALID_PEER_KEY })).rejects.toBeInstanceOf(PeerAlreadyExistsError)
        // не должен дойти до фактического `set`
        expect(execFileAsyncMock).toHaveBeenCalledTimes(1)
      })

      it('throws AmneziaWGError when the peer is missing after being added', async () => {
        execFileAsyncMock
          .mockResolvedValueOnce(okResult(dumpWithoutPeer())) // getPeer before: not found
          .mockResolvedValueOnce(okResult('')) // set command
          .mockResolvedValueOnce(okResult(dumpWithoutPeer())) // getPeer after: still not found

        await expect(awg.addPeer({ publicKey: VALID_PEER_KEY })).rejects.toBeInstanceOf(AmneziaWGError)
      })
    })

    describe('command building', () => {
      async function addPeerAndCaptureSetArgs(options: Parameters<typeof awg.addPeer>[0]) {
        execFileAsyncMock
          .mockResolvedValueOnce(okResult(dumpWithoutPeer())) // getPeer before
          .mockResolvedValueOnce(okResult('')) // set command
          .mockResolvedValueOnce(okResult(dumpWithPeer(options.publicKey))) // getPeer after

        await awg.addPeer(options)

        const setCall = execFileAsyncMock.mock.calls[1]
        return setCall?.[1] as string[]
      }

      it('builds the minimal `set ... peer <key>` command', async () => {
        const args = await addPeerAndCaptureSetArgs({ publicKey: VALID_PEER_KEY })
        expect(args).toEqual(['set', 'awg0', 'peer', VALID_PEER_KEY])
      })

      it('adds "preshared-key none" when presharedKey is explicitly null', async () => {
        const args = await addPeerAndCaptureSetArgs({ publicKey: VALID_PEER_KEY, presharedKey: null })
        expect(args).toContain('preshared-key')
        expect(args[args.indexOf('preshared-key') + 1]).toBe('none')
      })

      it('adds a validated preshared-key value when provided', async () => {
        const args = await addPeerAndCaptureSetArgs({
          publicKey: VALID_PEER_KEY,
          presharedKey: VALID_PRESHARED_KEY,
        })
        expect(args[args.indexOf('preshared-key') + 1]).toBe(VALID_PRESHARED_KEY)
      })

      it('does not add preshared-key when omitted', async () => {
        const args = await addPeerAndCaptureSetArgs({ publicKey: VALID_PEER_KEY })
        expect(args).not.toContain('preshared-key')
      })

      it('adds endpoint when provided', async () => {
        const args = await addPeerAndCaptureSetArgs({
          publicKey: VALID_PEER_KEY,
          endpoint: '203.0.113.10:51820',
        })
        expect(args[args.indexOf('endpoint') + 1]).toBe('203.0.113.10:51820')
      })

      it('does not add endpoint when falsy/omitted', async () => {
        const args = await addPeerAndCaptureSetArgs({ publicKey: VALID_PEER_KEY })
        expect(args).not.toContain('endpoint')
      })

      it('stringifies persistentKeepalive', async () => {
        const args = await addPeerAndCaptureSetArgs({
          publicKey: VALID_PEER_KEY,
          persistentKeepalive: 25,
        })
        expect(args[args.indexOf('persistent-keepalive') + 1]).toBe('25')
      })

      it('joins allowedIps with commas', async () => {
        const args = await addPeerAndCaptureSetArgs({
          publicKey: VALID_PEER_KEY,
          allowedIps: ['10.9.0.2/32', 'fd00::2/128'],
        })
        expect(args[args.indexOf('allowed-ips') + 1]).toBe('10.9.0.2/32,fd00::2/128')
      })

      it('uses "none" when allowedIps is an empty array', async () => {
        const args = await addPeerAndCaptureSetArgs({ publicKey: VALID_PEER_KEY, allowedIps: [] })
        expect(args[args.indexOf('allowed-ips') + 1]).toBe('none')
      })

      it('passes advancedSecurity through as-is', async () => {
        const args = await addPeerAndCaptureSetArgs({
          publicKey: VALID_PEER_KEY,
          advancedSecurity: 'on',
        })
        expect(args[args.indexOf('advanced-security') + 1]).toBe('on')
      })
    })

    describe('happy path', () => {
      it('returns the newly created peer status', async () => {
        execFileAsyncMock
          .mockResolvedValueOnce(okResult(dumpWithoutPeer()))
          .mockResolvedValueOnce(okResult(''))
          .mockResolvedValueOnce(okResult(dumpWithPeer(VALID_PEER_KEY)))

        const peer = await awg.addPeer({ publicKey: VALID_PEER_KEY })

        expect(peer.publicKey).toBe(VALID_PEER_KEY)
      })
    })
  })

  describe('updatePeer', () => {
    const awg = new AmneziaWG({ interface: 'awg0' })

    it('throws InvalidKeyError when public key format is invalid', async () => {
      await expect(awg.updatePeer({ publicKey: 'invalid-key' })).rejects.toBeInstanceOf(InvalidKeyError)
      expect(execFileAsyncMock).not.toHaveBeenCalled()
    })

    it('throws PeerNotFoundError when the peer does not exist', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(dumpWithoutPeer()))

      await expect(awg.updatePeer({ publicKey: VALID_PEER_KEY })).rejects.toBeInstanceOf(PeerNotFoundError)
      expect(execFileAsyncMock).toHaveBeenCalledTimes(1)
    })

    it('throws InvalidKeyError for a malformed presharedKey', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(dumpWithPeer(VALID_PEER_KEY)))

      await expect(awg.updatePeer({ publicKey: VALID_PEER_KEY, presharedKey: 'malformed-psk' })).rejects.toBeInstanceOf(
        InvalidKeyError
      )
    })

    it('throws AmneziaWGError if the peer disappeared after update', async () => {
      execFileAsyncMock
        .mockResolvedValueOnce(okResult(dumpWithPeer(VALID_PEER_KEY)))
        .mockResolvedValueOnce(okResult(''))
        .mockResolvedValueOnce(okResult(dumpWithoutPeer()))

      await expect(awg.updatePeer({ publicKey: VALID_PEER_KEY })).rejects.toBeInstanceOf(AmneziaWGError)
    })

    describe('argument building', () => {
      async function updatePeerAndCaptureSetArgs(
        options: Omit<Parameters<typeof awg.updatePeer>[0], 'publicKey'>
      ): Promise<string[]> {
        execFileAsyncMock
          .mockResolvedValueOnce(okResult(dumpWithPeer(VALID_PEER_KEY)))
          .mockResolvedValueOnce(okResult(''))
          .mockResolvedValueOnce(okResult(dumpWithPeer(VALID_PEER_KEY)))

        await awg.updatePeer({ publicKey: VALID_PEER_KEY, ...options })

        const call = execFileAsyncMock.mock.calls[1]
        return call![1] as string[]
      }

      it('builds base args with interface and peer key', async () => {
        const args = await updatePeerAndCaptureSetArgs({})
        expect(args).toEqual(['set', 'awg0', 'peer', VALID_PEER_KEY])
      })

      it('appends preshared-key when provided', async () => {
        const args = await updatePeerAndCaptureSetArgs({ presharedKey: VALID_PRESHARED_KEY })
        expect(args).toEqual(['set', 'awg0', 'peer', VALID_PEER_KEY, 'preshared-key', VALID_PRESHARED_KEY])
      })

      it('appends preshared-key "none" when null', async () => {
        const args = await updatePeerAndCaptureSetArgs({ presharedKey: null })
        expect(args).toEqual(['set', 'awg0', 'peer', VALID_PEER_KEY, 'preshared-key', 'none'])
      })

      it('appends endpoint when provided', async () => {
        const args = await updatePeerAndCaptureSetArgs({ endpoint: '198.51.100.1:51820' })
        expect(args).toEqual(['set', 'awg0', 'peer', VALID_PEER_KEY, 'endpoint', '198.51.100.1:51820'])
      })

      it('stringifies persistentKeepalive', async () => {
        const args = await updatePeerAndCaptureSetArgs({ persistentKeepalive: 25 })
        expect(args[args.indexOf('persistent-keepalive') + 1]).toBe('25')
      })

      it('joins allowedIps with commas', async () => {
        const args = await updatePeerAndCaptureSetArgs({ allowedIps: ['10.9.0.2/32', 'fd00::2/128'] })
        expect(args[args.indexOf('allowed-ips') + 1]).toBe('10.9.0.2/32,fd00::2/128')
      })

      it('uses "none" when allowedIps is an empty array', async () => {
        const args = await updatePeerAndCaptureSetArgs({ allowedIps: [] })
        expect(args[args.indexOf('allowed-ips') + 1]).toBe('none')
      })

      it('passes advancedSecurity through as-is', async () => {
        const args = await updatePeerAndCaptureSetArgs({ advancedSecurity: 'on' })
        expect(args[args.indexOf('advanced-security') + 1]).toBe('on')
      })
    })

    describe('happy path', () => {
      it('returns the updated peer status', async () => {
        execFileAsyncMock
          .mockResolvedValueOnce(okResult(dumpWithPeer(VALID_PEER_KEY)))
          .mockResolvedValueOnce(okResult(''))
          .mockResolvedValueOnce(okResult(dumpWithPeer(VALID_PEER_KEY)))

        const peer = await awg.updatePeer({ publicKey: VALID_PEER_KEY, endpoint: '1.2.3.4:51820' })
        expect(peer.publicKey).toBe(VALID_PEER_KEY)
      })
    })
  })

  describe('removePeer', () => {
    const awg = new AmneziaWG({ interface: 'awg0' })

    it('removes an existing peer', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(dumpWithPeer(VALID_PEER_KEY))).mockResolvedValueOnce(okResult(''))

      await awg.removePeer(VALID_PEER_KEY)

      expect(execFileAsyncMock).toHaveBeenNthCalledWith(2, 'awg', ['set', 'awg0', 'peer', VALID_PEER_KEY, 'remove'], {})
    })

    it('throws PeerNotFoundError when the peer does not exist', async () => {
      execFileAsyncMock.mockResolvedValueOnce(okResult(dumpWithoutPeer()))
      await expect(awg.removePeer(VALID_PEER_KEY)).rejects.toBeInstanceOf(PeerNotFoundError)
      expect(execFileAsyncMock).toHaveBeenCalledTimes(1)
    })

    it('throws InvalidKeyError for a malformed public key', async () => {
      await expect(awg.removePeer('not-a-key')).rejects.toBeInstanceOf(InvalidKeyError)
      expect(execFileAsyncMock).not.toHaveBeenCalled()
    })
  })
})
