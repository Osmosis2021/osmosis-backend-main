const router = require('express').Router()
const mongoose = require('mongoose');
const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');
const { requireAuth } = require('../middleware/auth');

// Returns the chat if the user is one of its participants, otherwise null.
const findChatForMember = async (chatId, userId) => {
    if (!mongoose.isValidObjectId(chatId)) return null;
    return Chat.findOne({ _id: chatId, users: userId });
};

// SENDING MESSAGE
// The sender is always the signed-in user (any `_id` in the body is ignored).
router.post('/sendMessage', requireAuth, async (req, res, next) => {
    try {
        const { chatId, content } = req.body;

        if (!content || !String(content).trim() || !chatId) {
            return res.status(400).json({ message: 'A message needs some text.' });
        }

        const chat = await findChatForMember(chatId, req.currentUser._id);
        if (!chat) {
            return res.status(403).json({ message: 'You are not part of this conversation.' });
        }

        let message = await Message.create({
            sender: req.currentUser._id,
            content: String(content),
            chat: chat._id,
        });

        // Populate data consistently
        message = await message.populate("sender", 'userName profileImage')
        message = await message.populate('chat')
        message = await User.populate(message, {
            path: 'chat.users',
            select: '_id userName profileImage',
        });

        await Chat.findByIdAndUpdate(chat._id, {
            latestMessage: message,
        });

        res.json(message);
    } catch (err) {
        next(err);
    }
});



// FETCHING MESSAGES
router.get('/allMessages/:chatId', requireAuth, async (req, res, next) => {
    try {
        const { chatId } = req.params;
        const chat = await findChatForMember(chatId, req.currentUser._id);
        if (!chat) {
            return res.status(403).json({ message: 'You are not part of this conversation.' });
        }

        const messages = await Message.find({ chat: chat._id })
            .populate('sender', 'userName profileImage')
            .populate('chat');
        res.json(messages)
    } catch (error) {
        next(error);
    }
})


module.exports = router;
