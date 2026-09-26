import type { InterfaceStatus, PeerStatus } from '../types/index.js'

function parseNullable(value: string | undefined): string | null {
  if (value === undefined || value === '(null)' || value === '(none)' || value === 'off') {
    return null
  }
  return value
}

function parseOffOrNumber(value: string | undefined): number | null {
  if (value === undefined || value === 'off') return null
  return Number(value)
}

function parseInterfaceLine(fields: string[], hasInterfaceName: boolean): Omit<InterfaceStatus, 'peers'> {
  const offset = hasInterfaceName ? 1 : 0
  const interfaceName = hasInterfaceName ? fields[0]! : ''

  const [
    privateKey,
    publicKey,
    listenPort,
    jc,
    jmin,
    jmax,
    s1,
    s2,
    s3,
    s4,
    h1,
    h2,
    h3,
    h4,
    i1,
    i2,
    i3,
    i4,
    i5,
    fwmark,
    contentPaddingAddition,
    rekeyAfterTime,
    rekeyTimeout,
    rejectAfterTime,
    keepaliveTimeout,
    maxHandshakeAttempts,
    randomTrailers,
    disableCookies,
    headerProtectionKey,
  ] = fields.slice(offset)

  if (privateKey === undefined || publicKey === undefined || listenPort === undefined)
    throw new Error('Malformed awg dump interface line')

  return {
    interface: interfaceName,
    privateKey,
    publicKey,
    listeningPort: Number(listenPort),
    fwmark: parseNullable(fwmark),
    obfuscation: {
      jc: Number(jc),
      jmin: Number(jmin),
      jmax: Number(jmax),
      s1: Number(s1),
      s2: Number(s2),
      s3: Number(s3),
      s4: Number(s4),
      h1: Number(h1),
      h2: Number(h2),
      h3: Number(h3),
      h4: Number(h4),
    },
    signaturePackets: {
      i1: parseNullable(i1),
      i2: parseNullable(i2),
      i3: parseNullable(i3),
      i4: parseNullable(i4),
      i5: parseNullable(i5),
    },
    timings: {
      contentPaddingAddition: Number(contentPaddingAddition),
      rekeyAfterTime: Number(rekeyAfterTime),
      rekeyTimeout: Number(rekeyTimeout),
      rejectAfterTime: Number(rejectAfterTime),
      keepaliveTimeout: Number(keepaliveTimeout),
      maxHandshakeAttempts: Number(maxHandshakeAttempts),
    },
    randomTrailers: randomTrailers === 'on',
    disableCookies: disableCookies === 'on',
    headerProtectionKey: parseNullable(headerProtectionKey),
  }
}

function parsePeerLine(fields: string[], hasInterfaceName: boolean): PeerStatus {
  const offset = hasInterfaceName ? 1 : 0
  const peerFields = fields.slice(offset)

  if (peerFields.length < 8 || peerFields[0] === undefined) {
    throw new Error('Malformed awg dump peer line')
  }

  const publicKey = peerFields[0]
  const presharedKey = peerFields[1]
  const endpoint = peerFields[2]
  const allowedIps = peerFields[3] ?? '(none)'
  const latestHandshake = peerFields[4]
  const transferRx = peerFields[5]
  const transferTx = peerFields[6]

  const persistentKeepalive = peerFields[7]

  const handshakeUnix = Number(latestHandshake ?? 0)
  
  return {
    publicKey,
    presharedKey: parseNullable(presharedKey),
    endpoint: parseNullable(endpoint),
    allowedIps: allowedIps === '(none)' || allowedIps === '(null)' ? [] : allowedIps.split(',').filter(Boolean),
    latestHandshake: handshakeUnix > 0 ? new Date(handshakeUnix * 1000) : null,
    transfer: {
      rxBytes: BigInt(transferRx ?? 0),
      txBytes: BigInt(transferTx ?? 0),
    },
    persistentKeepalive: parseOffOrNumber(persistentKeepalive),
  }
}

export function parseAwgDump(dump: string, fallbackInterface?: string): InterfaceStatus {
  const lines = dump.trim().split('\n').filter(Boolean)
  if (lines.length === 0) throw new Error('Empty awg dump output')

  const firstLine = lines[0]!
  const firstFields = firstLine.split('\t')

  const hasInterfaceName = firstFields.length > 20 && !firstFields[0]!.match(/^[A-Za-z0-9+/]{43}=$/)

  const interfaceStatus = parseInterfaceLine(firstFields, hasInterfaceName)

  if (!interfaceStatus.interface && fallbackInterface) {
    interfaceStatus.interface = fallbackInterface
  }

  const peers = lines.splice(1).map((line) => parsePeerLine(line.split('\t'), hasInterfaceName))

  return { ...interfaceStatus, peers }
}
