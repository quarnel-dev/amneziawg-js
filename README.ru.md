# amneziawg

[Читать на английском](README.md) | Русский

> ⚠️ **Ранняя стадия.** Основной функционал работает и протестирован на реальном сервере AmneziaWG, но API может ещё измениться до стабильной версии `1.0.0`.

Неофициальная Node.js/TypeScript обёртка над CLI [AmneziaWG](https://github.com/amnezia-vpn/amneziawg-go) (`awg`).

Этот проект **не связан с командой Amnezia и не одобрен ею** — это независимая, созданная сообществом обёртка.

## Возможности

- Проверка, установлен ли AmneziaWG CLI
- Генерация пар ключей и preshared-ключей
- Добавление, обновление, удаление и получение информации о peer'ах
- Проверка онлайн-активности peer'а (`isPeerActive`)
- Типизированный статус интерфейса и peer'ов, парсится из `awg show <interface> dump` (включая специфичные для AmneziaWG параметры обфускации: `Jc`/`Jmin`/`Jmax`, `S1-S4`, `H1-H4`, `HeaderProtectionKey`)
- Типизированные ошибки для типовых ситуаций (неверный формат ключа, дублирующийся/отсутствующий peer)

## Использование

```ts
import { AmneziaWG, PeerAlreadyExistsError, isPeerActive } from 'amneziawg'

const awg = new AmneziaWG({ interface: 'awg0' })

if (!(await awg.isInstalled())) {
  throw new Error('AmneziaWG CLI is not installed')
}

const keys = await awg.generateKeys()

try {
  const peer = await awg.addPeer({
    publicKey: keys.publicKey,
    allowedIps: ['10.9.0.2/32'],
  })
  console.log('Added peer:', peer)
} catch (error) {
  if (error instanceof PeerAlreadyExistsError) {
    console.log('Peer already exists:', error.publicKey)
  } else {
    throw error
  }
}

// Обновление существующего peer'а на лету
await awg.updatePeer({
  publicKey: keys.publicKey,
  allowedIps: ['10.9.0.2/32', '10.9.0.3/32'],
  persistentKeepalive: 25,
})

const status = await awg.getStatus()
const peers = await awg.getPeers()
const singlePeer = await awg.getPeer(keys.publicKey)

// Проверка активности peer'а (был ли handshake за последние 180 секунд)
if (singlePeer && isPeerActive(singlePeer)) {
  console.log('Peer активен')
}

await awg.removePeer(keys.publicKey)
```

## Обработка ошибок

Все ошибки, которые бросает эта библиотека, наследуются от `AmneziaWGError`, поэтому их можно ловить как вместе, так и по отдельности:

```ts
import { AmneziaWGError, PeerNotFoundError } from 'amneziawg'

try {
  await awg.removePeer(somePublicKey)
} catch (error) {
  if (error instanceof PeerNotFoundError) {
    // обработка отсутствующего peer
  } else if (error instanceof AmneziaWGError) {
    // обработка любой другой ошибки библиотеки
  }
}
```

## Требования

- Linux с установленным `awg` ([официальная инструкция по установке](https://docs.amnezia.org/))
- Node.js >= 20
- Root/sudo для команд, управляющих интерфейсом (`addPeer`, `updatePeer`, `removePeer`)

## Статус

Доступно в npm как `0.2.0`. Управление интерфейсом (up/down), генерация конфигов и QR-кодов запланированы на будущие версии.

_Сделано с ❤️ от Quarnel_

