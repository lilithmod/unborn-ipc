import * as net from 'net'
import { eq } from 'xpipe'


const SOCKETFILE = '/tmp/lilith.sock'

const client = net.createConnection(eq(SOCKETFILE)).on('connect', () => {
    console.log('connected to server')
    client.write('test')
    client.end()
})