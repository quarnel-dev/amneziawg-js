import { describe, it, expect } from 'vitest'
import { parseAwgDump } from './parser.util.js'

const INTERFACE_LINE = [
  'MENZwC2GFlXO4H1HLNkfimgGIQzVRx+/Hk1MOy6qJkU=', // privateKey
  'gNXUdWkuXTdGIsefw1c9/u3WuR/W5lKTgARCDxMoj3s=', // publicKey
  '51822', // listenPort
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
  '0', // contentPaddingAddition..maxHandshakeAttempts
  'off',
  'off',
  'off', // randomTrailers, disableCookies, headerProtectionKey
].join('\t')

const PEER_LINE = [
  '0w5ovtxVw1rtngkzYctBYTHiszP6nYAmlGwpYJNELRE=', // publicKey
  '58JudYcFloLpplF8qBNjUATQYxi6Hk/wJ9YNivDz17g=', // presharedKey
  '(none)', // endpoint
  '10.9.0.2/32', // allowedIps
  '0', // latestHandshake
  '0',
  '0', // rx, tx
  'off', // persistentKeepalive
].join('\t')

describe('parseAwgDump', () => {
  it('throws on empty dump', () => {
    expect(() => parseAwgDump('')).toThrow('Empty awg dump output')
  })

  it('parses a real dump without interface name, using fallbackInterface', () => {
    const dump = `${INTERFACE_LINE}\n${PEER_LINE}`
    const result = parseAwgDump(dump, 'awg0')

    expect(result.interface).toBe('awg0')
    expect(result.privateKey).toBe('MENZwC2GFlXO4H1HLNkfimgGIQzVRx+/Hk1MOy6qJkU=')
    expect(result.publicKey).toBe('gNXUdWkuXTdGIsefw1c9/u3WuR/W5lKTgARCDxMoj3s=')
    expect(result.listeningPort).toBe(51822)
    expect(result.fwmark).toBeNull()
    expect(result.obfuscation).toEqual({
      jc: 4,
      jmin: 40,
      jmax: 70,
      s1: 0,
      s2: 0,
      s3: 0,
      s4: 0,
      h1: 1,
      h2: 2,
      h3: 3,
      h4: 4,
    })
    expect(result.signaturePackets).toEqual({ i1: null, i2: null, i3: null, i4: null, i5: null })
    expect(result.timings).toEqual({
      contentPaddingAddition: 0,
      rekeyAfterTime: 0,
      rekeyTimeout: 0,
      rejectAfterTime: 0,
      keepaliveTimeout: 0,
      maxHandshakeAttempts: 0,
    })
    expect(result.randomTrailers).toBe(false)
    expect(result.disableCookies).toBe(false)
    expect(result.headerProtectionKey).toBeNull()
  })

  it('parses the peer with no handshake yet', () => {
    const dump = `${INTERFACE_LINE}\n${PEER_LINE}`
    const [peer] = parseAwgDump(dump, 'awg0').peers

    expect(peer).toEqual({
      publicKey: '0w5ovtxVw1rtngkzYctBYTHiszP6nYAmlGwpYJNELRE=',
      presharedKey: '58JudYcFloLpplF8qBNjUATQYxi6Hk/wJ9YNivDz17g=',
      endpoint: null,
      allowedIps: ['10.9.0.2/32'],
      latestHandshake: null,
      transfer: { rxBytes: 0n, txBytes: 0n },
      persistentKeepalive: null,
    })
  })

  it('parses interface with no peers', () => {
    const result = parseAwgDump(INTERFACE_LINE, 'awg0')
    expect(result.peers).toEqual([])
  })

  it('leaves interface name empty when no fallback is given and dump has none', () => {
    const result = parseAwgDump(INTERFACE_LINE)
    expect(result.interface).toBe('')
  })
})
