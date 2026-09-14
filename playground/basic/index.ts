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

    console.log('\n--- Testing Mutating Methods (addPeer / removePeer) ---')

    const testPeerKeys = await awg.generateKeys()
    console.log('Generated test peer public key:', testPeerKeys.publicKey)

    console.log('Adding test peer to the interface...')
    await awg.addPeer({
      publicKey: testPeerKeys.publicKey,
      allowedIps: ['10.9.0.100/32'],
      jc: 5,
      jmin: 30,
      jmax: 60,
    })
    console.log('Peer added successfully.')

    const peersAfterAdd = await awg.getPeers()
    const addedPeerExists = peersAfterAdd.some((p) => p.publicKey === testPeerKeys.publicKey)
    console.log('Is new peer present in status dump?:', addedPeerExists)

    console.log('Removing test peer from the interface...')
    await awg.removePeer(testPeerKeys.publicKey)
    console.log('Peer removed successfully.')

    const peersAfterRemove = await awg.getPeers()
    const removedPeerExists = peersAfterRemove.some((p) => p.publicKey === testPeerKeys.publicKey)
    console.log('Is peer successfully cleaned up?:', !removedPeerExists)
  } catch (error) {
    console.error('Failed to read device dump data:', error)
  }
}

main().catch(console.error)
