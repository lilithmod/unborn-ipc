import * as fsp from 'fs/promises'
import EventEmitter from 'events'
import * as net from 'net'
import { Socket } from 'net'
import xpipe from 'xpipe'

interface IpcClient extends EventEmitter {
    write: (packet: Buffer) => void
    end: () => void
    next: () => Promise<Buffer>
    on(event: 'packet', listener: (packet: Buffer) => void): this
    on(event: 'end', listener: () => void): this
}

interface IpcServer extends EventEmitter {
    on(event: 'listen', listener: () => void): this
    on(event: 'connect', listener: (client: Socket) => void): this
}

async function cleanupSocket(path: string) {
    function throwError(e: Error) {
        throw e
    }

    try {
        await fsp.stat(path)
        try {
            await fsp.unlink(path)
        } catch (e) {
            throwError(e)
        }
    } catch (e) {
        return
    }
}

export async function ipcListen(path: string, handler: (client: IpcClient) => void): Promise<IpcServer> {
    const emitter = new EventEmitter()

    path = xpipe.eq(path)

    await cleanupSocket(path)

    const connections: Map<number, Socket> = new Map<number, Socket>()

    const server = net.createServer(c => {
        const client: IpcClient = new EventEmitter() as any

        emitter.emit('connect', c)

        const self = Date.now()
        connections.set(self, c)
        c.on('end', () => {
            client.emit('end')
            connections.delete(self)
        })

        client.write = (packet) => {
            c.write(packet)
        }

        client.end = () => {
            c.end()
        }

        c.on('data', data => {
            client.emit('packet', data)
        })

        client.next = () => {
            return new Promise((resolve, reject) => {
                client.once('packet', resolve)
                client.once('end', reject)
            })
        }

        handler(client)
    })

    server.listen(path)
    emitter.emit('listen')

    return emitter
}