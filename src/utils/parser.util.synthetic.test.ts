import { describe, it, expect } from 'vitest'
import { parseAwgDump } from './parser.util.js'

describe('parseAwgDump (synthetic edge cases)', () => {
  it('parses interface line WITH interface name prefix', () => {
    const line = [
      'awg0', // interface name prefix
      'MENZwC2GFlXO4H1HLNkfimgGIQzVRx+/Hk1MOy6qJkU=',
      'gNXUdWkuXTdGIsefw1c9/u3WuR/W5lKTgARCDxMoj3s=',
      '51822',
      '4',
      '40',
      '70',
      '0',
      '0',
      '0',
      '0',
      '1',
      '2',
      '3',
      '4',
      '(null)',
      '(null)',
      '(null)',
      '(null)',
      '(null)',
      '(none)',
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

    const result = parseAwgDump(line)
    expect(result.interface).toBe('awg0')
    expect(result.peers).toEqual([])
  })

  it('parses a peer with active handshake and non-zero transfer', () => {
    const interfaceLine = [
      'MENZwC2GFlXO4H1HLNkfimgGIQzVRx+/Hk1MOy6qJkU=',
      'gNXUdWkuXTdGIsefw1c9/u3WuR/W5lKTgARCDxMoj3s=',
      '51822',
      '4',
      '40',
      '70',
      '0',
      '0',
      '0',
      '0',
      '1',
      '2',
      '3',
      '4',
      '(null)',
      '(null)',
      '(null)',
      '(null)',
      '(null)',
      '(none)',
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

    const handshakeUnix = 1_700_000_000
    const peerLine = [
      '0w5ovtxVw1rtngkzYctBYTHiszP6nYAmlGwpYJNELRE=',
      '58JudYcFloLpplF8qBNjUATQYxi6Hk/wJ9YNivDz17g=',
      '203.0.113.10:51820',
      '10.9.0.2/32',
      String(handshakeUnix),
      '12345',
      '67890',
      '25',
    ].join('\t')

    const dump = `${interfaceLine}\n${peerLine}`
    const peer = parseAwgDump(dump, 'awg0').peers[0]!

    expect(peer.endpoint).toBe('203.0.113.10:51820')
    expect(peer.latestHandshake).toEqual(new Date(handshakeUnix * 1000))
    expect(peer.transfer).toEqual({ rxBytes: 12345n, txBytes: 67890n })
    expect(peer.persistentKeepalive).toBe(25)
  })

  it('parses multiple allowedIps separated by comma', () => {
    const interfaceLine = [
      'MENZwC2GFlXO4H1HLNkfimgGIQzVRx+/Hk1MOy6qJkU=',
      'gNXUdWkuXTdGIsefw1c9/u3WuR/W5lKTgARCDxMoj3s=',
      '51822',
      '4',
      '40',
      '70',
      '0',
      '0',
      '0',
      '0',
      '1',
      '2',
      '3',
      '4',
      '(null)',
      '(null)',
      '(null)',
      '(null)',
      '(null)',
      '(none)',
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

    const peerLine = [
      '0w5ovtxVw1rtngkzYctBYTHiszP6nYAmlGwpYJNELRE=',
      '(none)',
      '(none)',
      '10.9.0.2/32,fd00::2/128',
      '0',
      '0',
      '0',
      'off',
    ].join('\t')

    const dump = `${interfaceLine}\n${peerLine}`
    const peer = parseAwgDump(dump, 'awg0').peers[0]!

    expect(peer.allowedIps).toEqual(['10.9.0.2/32', 'fd00::2/128'])
  })

  it('throws on malformed peer line (too few fields)', () => {
    const interfaceLine = [
      'MENZwC2GFlXO4H1HLNkfimgGIQzVRx+/Hk1MOy6qJkU=',
      'gNXUdWkuXTdGIsefw1c9/u3WuR/W5lKTgARCDxMoj3s=',
      '51822',
      '4',
      '40',
      '70',
      '0',
      '0',
      '0',
      '0',
      '1',
      '2',
      '3',
      '4',
      '(null)',
      '(null)',
      '(null)',
      '(null)',
      '(null)',
      '(none)',
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

    const brokenPeerLine = ['0w5ovtxVw1rtngkzYctBYTHiszP6nYAmlGwpYJNELRE=', '(none)'].join('\t')
    const dump = `${interfaceLine}\n${brokenPeerLine}`

    expect(() => parseAwgDump(dump, 'awg0')).toThrow('Malformed awg dump peer line')
  })
})
