import * as fsp from 'fs/promises'
import EventEmitter from 'events'
import * as net from 'net'
import { Socket } from 'net'
import xpipe from 'xpipe'
import FIFO from 'fifo'
import fifo from 'fifo'

export interface IpcClient extends EventEmitter {
    write: (packet: Buffer) => void
    end: () => void
    next: () => Promise<Buffer>

    on(event: 'next', listener: (packet: Buffer) => void): this

    on(event: 'end', listener: () => void): this

    packets: FIFO<Buffer>
    socket: Socket
}

export interface IpcServer extends EventEmitter {
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

const nullBuf = Buffer.from([0])

function splitBuffer(buffer: Buffer): Buffer[] {

    const result = []
    let start = 0
    while (true) {
        let nxt = buffer.indexOf(nullBuf, start)
        let chunk
        if (nxt == -1) {
            chunk = buffer.slice(start)
            result.push(chunk)
            break
        } else {
            chunk = buffer.slice(start, nxt)
            result.push(chunk)
        }
        start = nxt + 1
    }

    return result
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

        client.socket = c

        client.write = (packet) => {
            c.write(packet)
        }

        client.end = () => {
            c.end()
        }

        // c.on('data', data => {
        //     client.emit('packet', data)
        // })

        client.packets = fifo<Buffer>()


        c.on('data', data => {
            console.log('data', data.toString())
            console.log(splitBuffer(data).map(buf => buf.toString()))
            client.packets.push(data)
            client.emit('next', data)
        })

        client.next = () => {
            return new Promise((resolve, reject) => {
                if (client.packets.length > 0) {
                    // console.log(client.packets.shift())
                    // @ts-ignore
                    resolve(client.packets.shift())
                } else {
                    client.once('next', (data) => {
                        // const packet = client.packets.first()
                        // client.packets.shift().value
                        // console.log(client.packets.shift())
                        // @ts-ignore
                        resolve(client.packets.shift())
                    })
                }
                client.once('end', reject)
            })
        }

        handler(client)
    })

    server.listen(path)
    emitter.emit('listen')

    return emitter
}