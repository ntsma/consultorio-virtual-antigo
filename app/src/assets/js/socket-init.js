const socket = io();

const initSocket = () => {
    socket.on('connect', () => {
        if (isIOS()) {
            socket.emit('reconnect-room', ROOM_ID);
        }
    });

    socket.on('user-connected', (userId) => {
        console.log('Usuário conectado:', userId);
        setTimeout(() => {
            connectNewUser(userId, stream);
        }, isIOS() ? 2000 : 1000);
    });

    setInterval(() => {
        if (isIOS()) {
            socket.emit('check-participants', ROOM_ID);
        }
    }, 5000);
};