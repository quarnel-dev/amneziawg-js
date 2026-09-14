# amneziawg

[Read in Russian](README.ru.md) | English

> ⚠️ **Work in progress.** No functional code yet — this repository currently holds only project scaffolding. A working `0.0.1` is coming soon.

Unofficial Node.js/TypeScript wrapper around the [AmneziaWG](https://github.com/amnezia-vpn/amneziawg-go) CLI (`awg`, `awg-quick`).

This project is **not affiliated with or endorsed by the Amnezia team** — it's an independent, community-made wrapper.

## Planned API

```ts
import { AmneziaWG } from 'amneziawg';

const awg = new AmneziaWG({ interface: 'awg0' });

if (!(await awg.isInstalled())) {
  throw new Error('AmneziaWG CLI is not installed');
}

const keys = await awg.generateKeys();

await awg.addPeer({
  publicKey: keys.publicKey,
  allowedIps: ['10.9.0.2/32'],
});

const peers = await awg.getPeers();
```

## Requirements

- Linux with `awg` / `awg-quick` installed ([official install guide](https://docs.amnezia.org/))
- Node.js >= 18
- Root/sudo for interface management commands

## Status

Not ready for use yet. Follow this repository for progress.

*Made with ❤️ by Quarnel*