import { AmneziaWG } from 'amneziawg'

const awg = new AmneziaWG({
  interface: 'awg0',
})

const inst = await awg.isInstalled()
console.log('Installed: ', inst)

const keys = await awg.generateKeys()
console.log('Keys: ', keys)

const presharedKey = await awg.generatePresharedKey()
console.log('PresharedKey: ', presharedKey)
