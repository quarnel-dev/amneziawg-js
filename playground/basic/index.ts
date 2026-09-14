import { AmneziaWG } from 'amneziawg'

async function main() {
  console.log('Starting AmneziaWG playground testing...')

  const awg = new AmneziaWG({
    interface: 'awg0',
  })

  const isInstalled = await awg.isInstalled()
  console.log('CLI Installed:', isInstalled)

  if (!isInstalled) {
    console.error('Error: awg utility not found in system paths.')
    return
  }

  const keys = await awg.generateKeys()
  console.log('Generated Interface Keys:', keys)

  const presharedKey = await awg.generatePresharedKey()
  console.log('Generated Preshared Key:', presharedKey)

  console.log('\n--- Fetching live runtime data ---')

  try {
    const status = await awg.getStatus()
    console.log('Interface Status parsed successfully:')
    console.dir(status, { depth: null, colors: true })

    const peers = await awg.getPeers()
    console.log(`Total peers found: ${peers.length}`)

    if (peers.length > 0) {
      const targetPublicKey = peers[0]!.publicKey
      console.log(`Fetching individual peer data for key: ${targetPublicKey}`)

      const peer = await awg.getPeer(targetPublicKey)
      console.dir(peer, { depth: null, colors: true })
    }
  } catch (error) {
    console.error('Failed to read device dump data:', error)
  }
}

main().catch(console.error)
