const router = require('express').Router()
const asyncHandler = require("express-async-handler");
const User = require('../models/user');
const Chat = require('../models/chat');
const jwt = require('jsonwebtoken');
const Message = require('../models/message');
const mongoose = require('mongoose');
const jwtSecret = process.env.ACCESS_TOKEN_SECRET


// SENDING MESSAGE
router.post('/sendMessage', asyncHandler(async (req, res) => {
    const { chatId, content, _id } = req.body;
    const accessToken = req?.headers?.authorization?.slice(7);
    
    if (!content || !chatId) {
        console.log('Invalid data passed into request');
        return res.sendStatus(400);
    }

    try {
        // Start a Mongoose transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
            if (err) {
                // Handle accessToken verification error (e.g., invalid accessToken)
                res.status(401).json({ error: 'Unauthorized' });
                return session.endSession(); // End the transaction
            }

            const newMessage = {
                sender: _id,
                content: content,
                chat: chatId,
            };

            let message = await Message.create(newMessage);

            // Populate data consistently
            message = await message.populate("sender", 'userName profileImage')
            message = await message.populate('chat')
            message = await User.populate(message, {
                path: 'chat.users',
                select: '_id userName profileImage',
            });

            await Chat.findByIdAndUpdate(req.body.chatId, {
                latestMessage: message,
            });

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            res.json(message);
        });
    } catch (err) {
        res.status(400);
        console.error(err);
        res.json({ error: 'An error occurred' });

        // Rollback the transaction in case of an error
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
    }
}));



// FETCHING MESSAGES
router.get('/allMessages/:chatId', asyncHandler(async (req, res) => {
    const {chatId} = req.params;
    // const accessToken = req.headers.authorization
    const accessToken = req?.headers?.authorization?.slice(7) 

    // Verify the JWT accessToken to get user data
    jwt.verify(accessToken, jwtSecret, {}, async (err, userData) => {
        if (err) {
            // Handle accessToken verification error (e.g., invalid accessToken)
            return res.status(401).json({ error: 'Unauthorized' });
            console.log('error:', err)
        }
        try {
            const messages = await Message.find({ chat: chatId }).populate(
                'sender', 'userName profileImage')
                .populate('chat');
                res.json(messages)
        } catch (error) {
            res.status(400)
            throw new Error (error.message)
        }
    })
}))


module.exports = router;