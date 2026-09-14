# amneziawg

[Read in Russian](README.ru.md) | English

> ⚠️ **Early stage.** Core functionality works and is tested against a real AmneziaWG server, but the API may still change before a stable `1.0.0`.

Unofficial Node.js/TypeScript wrapper around the [AmneziaWG](https://github.com/amnezia-vpn/amneziawg-go) CLI (`awg`).

This project is **not affiliated with or endorsed by the Amnezia team** — it's an independent, community-made wrapper.

## Features

- Check if the AmneziaWG CLI is installed
- Generate key pairs and preshared keys
- Add, remove, and query peers
- Typed interface & peer status, parsed from `awg show <interface> dump` (including AmneziaWG-specific obfuscation parameters: `Jc`/`Jmin`/`Jmax`, `S1-S4`, `H1-H4`, `HeaderProtectionKey`)
- Typed errors for common failure cases (invalid key format, duplicate/missing peer)

## Usage

```ts
import { AmneziaWG, PeerAlreadyExistsError } from 'amneziawg';

const awg = new AmneziaWG({ interface: 'awg0' });

if (!(await awg.isInstalled())) {
  throw new Error('AmneziaWG CLI is not installed');
}

const keys = await awg.generateKeys();

try {
  const peer = await awg.addPeer({
    publicKey: keys.publicKey,
    allowedIps: ['10.9.0.2/32'],
  });
  console.log('Added peer:', peer);
} catch (error) {
  if (error instanceof PeerAlreadyExistsError) {
    console.log('Peer already exists:', error.publicKey);
  } else {
    throw error;
  }
}

const status = await awg.getStatus();
const peers = await awg.getPeers();
const singlePeer = await awg.getPeer(keys.publicKey);

await awg.removePeer(keys.publicKey);
```

## Error handling

All errors thrown by this library extend `AmneziaWGError`, so they can be caught together or individually:

```ts
import { AmneziaWGError, PeerNotFoundError } from 'amneziawg';

try {
  await awg.removePeer(somePublicKey);
} catch (error) {
  if (error instanceof PeerNotFoundError) {
    // handle missing peer
  } else if (error instanceof AmneziaWGError) {
    // handle any other library error
  }
}
```

## Requirements

- Linux with `awg` installed ([official install guide](https://docs.amnezia.org/))
- Node.js >= 20
- Root/sudo for commands that manage the interface (`addPeer`, `removePeer`)

## Status

Available on npm as `0.1.0`. Interface up/down management, config file generation, and QR code helpers are planned for later versions.

*Made with ❤️ by Quarnel*