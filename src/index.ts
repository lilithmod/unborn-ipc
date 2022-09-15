import * as fsp from 'fs/promises'
import EventEmitter from 'events'
import * as net from 'net'
import { Socket } from 'net'
import xpipe from 'xpipe'

interface IpcClient extends EventEmitter {
    write: (packet: Buffer) => void
    on(event: 'packet', listener: (packet: Buffer) => void): this
}

async function cleanupSocket(path: string) {
    function throwError(e: Error) {
        throw e
    }

    try {
        await fsp.stat(path)
        try {
            console.log('Cleaning up socket')
            await fsp.unlink(path)
        } catch (e) {
            throwError(e)
        }
    } catch (e) {
        return
    }
}

export async function ipcListen(path: string, handler: (client: IpcClient) => void) {
    path = xpipe.eq(path)

    await cleanupSocket(path)

    const connections: Map<number, Socket> = new Map<number, Socket>()

    const server = net.createServer(c => {
        console.log('Client connected')

        const self = Date.now()
        connections.set(self, c)
        c.on('end', () => {
            console.log('Client disconnected.')
            connections.delete(self)
        })

        const client: IpcClient = new EventEmitter() as any

        client.write = (packet) => {
            c.write(packet)
        }

        c.on('data', data => {
            client.emit('packet', data)
        })

        handler(client)
    })

    server.listen(path)
    console.log('Listening at', path)
}