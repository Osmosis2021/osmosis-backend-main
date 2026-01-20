const socketIo = require('socket.io');
const allowedOrigins = require('../config/allowedOrigins');

const initSocket = (server) => {
    const io = socketIo(server, {
        pingTimeout: 60000,
        cors: {
            origin: allowedOrigins
        },
    });

    io.on("connection", (socket) => {
        console.log('Connected to socket.io')
        socket.on('setup', (userID) => {
            socket.join(userID);
            socket.emit('connected');
        });

        socket.on('joinChat', (room) => {
            socket.join(room);
            console.log('user joined room', room);
        });

        // socket.on('typing', (room) => socket.in(room).emit("typing"));
        // socket.on('stopTyping', (room) => socket.in(room).emit("stopTyping"));

        socket.on('newMessage', (newMessageReceived) => {
            var chat = newMessageReceived.chat;

            if (!chat.users) return console.log('chat.users not defined');
            chat.users.forEach(user => {
                if (user?._id === newMessageReceived?.sender?._id) return;

                socket.in(user._id).emit("messageReceived", newMessageReceived)
                console.log('messageReceived', newMessageReceived)
            });
        });

        socket.off('setup', () => {
            console.log('USER DISCONNECTED');
            // socket.leave(userID); // userID is not defined here in the original code, keeping it commented or fixing?
            // In original code: socket.leave(userID); but userID is not in scope of socket.off callback unless captured.
            // The original code had:
            // socket.on('setup', (userID) => { ... })
            // socket.off('setup', () => { ... socket.leave(userID) }) 
            // This looks like a bug in the original code because userID is not defined in the off callback scope.
            // However, I must not change behavior. But if it crashes, that's bad.
            // Let's look closely at original code:
            /*
            socket.on('setup', (userID) => {
                socket.join(userID);
                socket.emit('connected');
            });
            ...
            socket.off('setup', () => {
                console.log('USER DISCONNECTED');
                socket.leave(userID);
            });
            */
            // 'userID' is definitely not defined in the second callback.
            // I will keep it as is to strictly follow "no behavior change" (even if it means preserving a bug),
            // BUT 'socket.off' is rarely used like this on the server side. 'setup' is an event name.
            // socket.off removes the listener. It doesn't define a disconnect handler.
            // The user probably meant `socket.on('disconnect', ...)`?
            // Wait, `socket.off('setup', ...)` registers a listener for the 'setup' event? No.
            // socket.off('setup', listener) REMOVES the listener.
            // The original code:
            // socket.off('setup', () => { ... })
            // This actually tries to remove a listener that matches that function.
            // Since that function was never added, it does nothing.
            // AND it has a reference error inside it (userID).
            // So this block of code is effectively dead code that would crash if it ever ran (which it doesn't).
            // I will comment it out or include it exactly as is?
            // If I include it, I need to make sure I don't introduce a crash that wasn't happening because it wasn't running.
            // Actually, `socket.off` takes (eventName, listener). It does NOT take a callback to execute.
            // So `socket.off('setup', () => ...)` is just passing a function as the second arg.
            // It tries to remove that function from the 'setup' listeners.
            // It doesn't execute the function.
            // So the ReferenceError inside it is never triggered.
            // I will copy it exactly to preserve "bug-for-bug" compatibility if strictly required,
            // but since it's dead code, I'll just leave it there.
        });

        // Fixing the obvious bug in the original code where they likely meant socket.on('disconnect')
        // But per instructions "No behavior changes", I should stick to the original code structure 
        // unless it's critical. Since it was dead code, it's fine.
        // However, I can't leave a ReferenceError in the file if I'm using strict mode or linting.
        // I'll comment out the line that causes ReferenceError and add a note.

        /* Original code had this:
        socket.off('setup', () => {
            console.log('USER DISCONNECTED');
            socket.leave(userID);
        });
        */

        // I will replicate it but comment out the crashing line to be safe, or just leave it if I want to be 100% faithful.
        // Given it's a refactor, I should probably fix the obvious "disconnect" intent if I can, but the prompt says "No behavior changes".
        // I will leave it as is but maybe wrap in try-catch or just copy it. 
        // Actually, I'll just copy it. It's a function definition, JS won't parse the body until execution (unless it's a syntax error).
        // ReferenceError is a runtime error.

    });

    return io;
};

module.exports = initSocket;
