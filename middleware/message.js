const router = require('express').Router()
const asyncHandler = require("express-async-handler");
const User = require('../models/user');
const Messgae = require('../models/message');
const Chat = require('../models/chat');
const jwt = require('jsonwebtoken');
const Message = require('../models/message');
const jwtSecret = 'randomString';


// SENDING MESSAGE
router.post('/sendMessage', asyncHandler(async (req, res) => {

    const { chatId, content } = req.body
    const {token} = req.cookies;

    console.log('chatId', chatId)
    console.log('content', content)

    if (!content || !chatId) {
        console.log('invalid data passed into request')
        return res.sendStatus(400);
    }

    // Verify the JWT token to get user data
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            // Handle token verification error (e.g., invalid token)
            return res.status(401).json({ error: 'Unauthorized' });
        }

        var newMessage = {
            sender: userData.id,
            content: content,
            chat: chatId
        }

        try {
            var message = await Message.create(newMessage);

            message = await message.populate('sender', 'userName firstName lastName email profileImage');
            message = await message.populate('chat');
            message = await User.populate(message, {
                path: "chat.users",
                select:"userName firstName lastName email profileImage"
            });

            await Chat.findByIdAndUpdate(req.body.chatId, {
                latestMessage: message,
            });
            res.json(message)
            
        } catch (err) {
            res.status(400)
            throw new Error (err.message)
        }





    })
}))


// FETCHING MESSAGES

router.get('/allMessages/:chatId', asyncHandler(async (req, res) => {
    const {chatId} = req.params;
    const {token} = req.cookies;
    console.log('in backend route allmessages/:chatId with this id:', chatId)

    // Verify the JWT token to get user data
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            // Handle token verification error (e.g., invalid token)
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const messages = await Message.find({ chat: chatId }).populate(
                'sender', 'userName profileImage email')
                .populate('chat');
                res.json(messages)
        } catch (error) {
            res.status(400)
            throw new Error (error.message)
        }







    })
}))



module.exports = router;
