const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    maxAge: 0
}));

// ===== ONLINE MULTIPLAYER =====
const rooms = {};

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

function rollDiceValues(count) {
    const values = [];
    for (let i = 0; i < count; i++) values.push(Math.floor(Math.random() * 6) + 1);
    return values;
}

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('createRoom', (callback) => {
        // Alten Raum aufräumen falls vorhanden
        if (socket.roomCode && rooms[socket.roomCode]) {
            delete rooms[socket.roomCode];
        }
        let code;
        do { code = generateRoomCode(); } while (rooms[code]);
        rooms[code] = { players: [socket.id], sockets: [socket, null] };
        socket.join(code);
        socket.roomCode = code;
        socket.playerNumber = 1;
        callback({ code: code });
        console.log('Room created:', code);
    });

    socket.on('joinRoom', (code, callback) => {
        if (!code || typeof code !== 'string') return callback({ error: 'Ungültiger Code' });
        code = code.toUpperCase().trim();
        const room = rooms[code];
        if (!room) return callback({ error: 'Raum nicht gefunden' });
        if (room.players.length >= 2) return callback({ error: 'Raum ist voll' });
        room.players.push(socket.id);
        room.sockets[1] = socket;
        socket.join(code);
        socket.roomCode = code;
        socket.playerNumber = 2;
        callback({ ok: true });
        io.to(code).emit('roomReady');
        console.log('Player 2 joined room:', code);
    });

    socket.on('gameAction', (action) => {
        if (!socket.roomCode || !rooms[socket.roomCode]) return;
        // Würfel-Werte serverseitig generieren
        if (action.type === 'rollDice' && action.diceCount) {
            action.diceValues = rollDiceValues(action.diceCount);
        }
        if (action.type === 'rerollDie') {
            action.newValue = Math.floor(Math.random() * 6) + 1;
        }
        if (action.type === 'useRestart' && action.diceCount) {
            action.diceValues = rollDiceValues(action.diceCount);
        }
        action.player = socket.playerNumber;
        io.to(socket.roomCode).emit('gameAction', action);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.roomCode && rooms[socket.roomCode]) {
            socket.to(socket.roomCode).emit('playerDisconnected');
            delete rooms[socket.roomCode];
        }
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
