# Unborn IPC

A very simple typescript wrapper to create a unix/windows socket and write data.

```ts
const SOCKETFILE = '/tmp/lilith.sock'

ipcListen(SOCKETFILE, client => {
    client.on('packet', packet => {
        console.log(packet.toString())
        client.write(Buffer.from('hi', 'utf-8'))
    })
})
```
