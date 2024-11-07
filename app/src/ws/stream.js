const stream = (socket) => {
    socket.on('subscribe', (data) => {
        // Junte-se à sala
        socket.join(data.room);
        socket.join(data.socketId);

        // Conte quantos usuários existem na sala
        const room = socket.adapter.rooms.get(data.room);
        const roomSize = room ? room.size : 0;

        // Emite o status da sala para todos os participantes
        io.to(data.room).emit('room status', {
            count: roomSize
        });

        // Informa outros membros sobre o novo usuário
        if (roomSize <= 5) {
            socket.to(data.room).emit('new user', { socketId: data.socketId });
        }
    });

    socket.on('newUserStart', (data) => {
        socket.to(data.to).emit('newUserStart', { sender: data.sender });
    });

    socket.on('sdp', (data) => {
        socket.to(data.to).emit('sdp', { description: data.description, sender: data.sender });
    });

    socket.on('ice candidates', (data) => {
        socket.to(data.to).emit('ice candidates', { candidate: data.candidate, sender: data.sender });
    });

    socket.on('chat', (data) => {
        socket.to(data.room).emit('chat', { sender: data.sender, msg: data.msg });
    });

    socket.on('disconnect', () => {
        const rooms = [...socket.rooms];
        rooms.forEach(room => {
            const remainingClients = socket.adapter.rooms.get(room);
            const count = remainingClients ? remainingClients.size - 1 : 0;
            
            socket.to(room).emit('room status', {
                count: count
            });
            socket.to(room).emit('user-left', { socketId: socket.id });
        });
    });
};

module.exports = stream;
