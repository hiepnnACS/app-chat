const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const { addUser, getUser, getUserInRoom, removeUser }  = require('./users');

// khi deploy se dung cong cua server, local dung cong 5000
const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });

        if(error) return callback(error);

        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room ${user.room}`})
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined!`})

        socket.join(user.room);

        io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room)})
        callback();
    })

    socket.on('sendMessage', (message, callback) => {
        // xem user nao gui tin nhan 
        const user = getUser(socket.id)
 
        io.to(user.room).emit('message', { user: user.name, text: message })
        io.to(user.room).emit('roomData', { room: user.room, text: message })

        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', {
                user: 'admin',
                text: `${user.name} has left`
            })
        }
    })
})

app.use(router);
app.use(cors());

server.listen(PORT, () => console.log(`Server has stated on port ${PORT}`))