# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-15

### Added

- `isInstalled()` — check whether the AmneziaWG CLI is available
- `generateKeys()` — generate a private/public key pair
- `generatePresharedKey()` — generate a preshared key
- `getStatus()` — get typed interface status, parsed from `awg show <interface> dump` (including AmneziaWG-specific obfuscation parameters and `HeaderProtectionKey`)
- `getPeers()` / `getPeer(publicKey)` — query peer status
- `addPeer(options)` — add a peer, returns the resulting `PeerStatus`, throws `PeerAlreadyExistsError` on duplicate
- `removePeer(publicKey)` — remove a peer, throws `PeerNotFoundError` if missing
- Typed error hierarchy: `AmneziaWGError`, `ExecError`, `InvalidKeyError`, `PeerAlreadyExistsError`, `PeerNotFoundError`
- Separate `amneziawg/types` entry point for type-only imports

[0.1.0]: https://github.com/quarnel-dev/amneziawg-js/releases/tag/v0.1.0