const express = require('express')
const cors = require('cors')
const app = express()
const server = require('http').createServer(app)
const {Server} = require('socket.io')
const io = new Server(server, {
    cors: {
        origin: '*',
    }
})
const {v4} = require('uuid')

require('dotenv').config()
app.use(cors())
app.use(express.json());


io.on('connection',socket=>{
    socket.on('login',clientUid=>{
        socket.emit('MemberJoined', clientUid)
        console.log('clientUid', clientUid)
    })
    socket.on('sendMessageToPeer',data=>{
        console.log('sendMessageToPeer', data)
        socket.broadcast.emit('MessageFromPeer',data)

    })
})

const PORT = process.env.PORT || 5001

app.post('/lobby', (req, res)=>{
console.log('req', req.body.code)
    res.send('good')
})



server.listen(PORT, ()=> console.log(`Server started at PORT ${PORT}`))



