import * as net from 'net'
import { eq } from 'xpipe'


const SOCKETFILE = '/tmp/lilith.sock'

// function to convert a string to a buffer and then append a null byte
function toBuf(str: string) {
    const buf = Buffer.from(str)
    const buf2 = Buffer.alloc(buf.length + 1)
    buf.copy(buf2)
    buf2.writeUInt8(0, buf2.length - 1)
    return buf2
}

setTimeout(() => {
    const client = net.createConnection(eq(SOCKETFILE)).on('connect', async () => {
        console.log('connected to server')
        function write(data, cb) {
            if (!client.write(data)) {
                client.once('drain', cb);
            } else {
                process.nextTick(cb);
            }
        }
        write('test', () => {
            write('test2', () => {
                write('test3', () => {})
            })
        })

        // client.end()
    })
}, 100)