import { ipcListen } from './index.js'

const SOCKETFILE = '/tmp/lilith.sock'

ipcListen(SOCKETFILE, async client => {
    const packet1 = await client.next()
    console.log('packet1', packet1.toString())
    setTimeout(async () => {
        const packet2 = await client.next()
        console.log('packet2', packet2.toString())
    }, 1000)
    const packet3 = await client.next()
    console.log('packet3', packet3.toString())
})

