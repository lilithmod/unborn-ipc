import { ipcListen } from './index.js'

const SOCKETFILE = '/tmp/lilith.sock'

ipcListen(SOCKETFILE, client => {
    client.on('packet', packet => {
        console.log(packet.toString())
    })
})

