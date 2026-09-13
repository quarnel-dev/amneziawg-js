# amneziawg

[Читать на английском](README.md) | Русский

> ⚠️ **В разработке.** Рабочего кода пока нет — в репозитории только заготовка проекта. Рабочая версия `0.0.1` скоро появится.

Неофициальная Node.js/TypeScript обёртка над CLI [AmneziaWG](https://github.com/amnezia-vpn/amneziawg-go) (`awg`, `awg-quick`).

Этот проект **не связан с командой Amnezia и не одобрен ею** — это независимая, созданная сообществом обёртка.

## Планируемый API

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

## Требования

- Linux с установленным `awg` / `awg-quick` ([официальная инструкция по установке](https://docs.amnezia.org/))
- Node.js >= 18
- Root/sudo для команд управления интерфейсом

## Статус

Пока не готово к использованию. Следите за репозиторием, чтобы не пропустить прогресс.

*Сделано с ❤️ от Quarnel*