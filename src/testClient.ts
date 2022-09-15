import * as net from 'net'

const SOCKETFILE = '/tmp/lilith.sock'

const client = net.createConnection(SOCKETFILE).on('connect', () => {
    console.log('connected to server')
    client.write('test')
    client.end()
})