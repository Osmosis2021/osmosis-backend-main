const socketIo = require('socket.io');
const mongoose = require('mongoose');
const allowedOrigins = require('../config/allowedOrigins');
const { verifyAccessToken } = require('../middleware/auth');
const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');

const initSocket = (server) => {
    const io = socketIo(server, {
        pingTimeout: 60000,
        cors: {
            origin: allowedOrigins
        },
    });

    // Every connection must present a valid access token (socket.handshake.auth.token).
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('unauthorized'));
            const decoded = await verifyAccessToken(token);
            const user = await User.findOne({ userName: decoded.userName }).select('_id');
            if (!user) return next(new Error('unauthorized'));
            socket.data.userId = String(user._id);
            next();
        } catch (err) {
            next(new Error('unauthorized'));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.data.userId;

        // Each user listens on a room named after their own ID. The client-supplied ID is ignored
        // so nobody can subscribe to someone else's messages.
        socket.on('setup', () => {
            socket.join(userId);
            socket.emit('connected');
        });

        socket.on('joinChat', async (room) => {
            try {
                if (!mongoose.isValidObjectId(room)) return;
                const isMember = await Chat.exists({ _id: room, users: userId });
                if (isMember) socket.join(String(room));
            } catch (err) {
                console.error('[socket] joinChat failed:', err.message);
            }
        });

        // The client announces a message it just saved through POST /message/sendMessage.
        // We reload it from the database and only relay it if this user really sent it,
        // so the payload cannot be forged.
        socket.on('newMessage', async (announced) => {
            try {
                const messageId = announced?._id;
                if (!mongoose.isValidObjectId(messageId)) return;

                const message = await Message.findById(messageId)
                    .populate('sender', 'userName profileImage')
                    .populate({ path: 'chat', populate: { path: 'users', select: '_id userName profileImage' } });
                if (!message || String(message.sender?._id) !== userId) return;

                message.chat.users.forEach((user) => {
                    if (String(user._id) === userId) return;
                    socket.in(String(user._id)).emit('messageReceived', message);
                });
            } catch (err) {
                console.error('[socket] newMessage relay failed:', err.message);
            }
        });
    });

    return io;
};

module.exports = initSocket;
