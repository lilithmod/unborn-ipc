import { ipcListen } from './index.js'

const SOCKETFILE = '/tmp/lilith.sock'

ipcListen(SOCKETFILE, async client => {
    const packet = await client.next()
    console.log(packet.toString())
})

