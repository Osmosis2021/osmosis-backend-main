const router = require('express').Router()
const mongoose = require('mongoose');
const User = require('../models/user');
const { PUBLIC_FIELDS } = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');
const { requireAuth, blockWhileActing } = require('../middleware/auth');

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Search other users by username or name. Email is not searchable, so addresses stay private.
router.get('/allUsers', requireAuth, async (req, res, next) => {
    try {
        const keyword = req.query.search
        const filter = keyword
            ? {
                $or: [
                    { userName: { $regex: escapeRegex(keyword), $options: 'i' } },
                    { firstName: { $regex: escapeRegex(keyword), $options: 'i' } },
                    { lastName: { $regex: escapeRegex(keyword), $options: 'i' } },
                ],
            }
            : {};
        // Exclude the currently logged-in user from the search results
        const users = await User.find({ ...filter, _id: { $ne: req.currentUser._id } }).select(PUBLIC_FIELDS).limit(50);
        res.send(users)
    } catch (err) {
        next(err);
    }
});


// Opens (or creates) the one-to-one chat between the signed-in user and another user.
// The `userID` query parameter is ignored; the signed-in user is always one participant.
router.get('/accessChats/:searchedUserID', requireAuth, blockWhileActing, async (req, res, next) => {
    try {
        const { searchedUserID } = req.params
        const userID = req.currentUser._id

        if (!mongoose.isValidObjectId(searchedUserID) || String(searchedUserID) === String(userID)) {
            return res.status(400).json({ message: 'Choose someone to message.' });
        }
        const otherUser = await User.exists({ _id: searchedUserID });
        if (!otherUser) {
            return res.status(404).json({ message: 'That user no longer exists.' });
        }

        var isChat = await Chat.find({
            $and: [
                { users: { $elemMatch: { $eq: searchedUserID } } },
                { users: { $elemMatch: { $eq: userID } } },
            ],
        }).populate("users", PUBLIC_FIELDS).populate("latestMessage")

        isChat = await User.populate(isChat, {
            path: 'latestMessage.sender',
            select: 'userName profileImage'
        });

        if (isChat.length > 0) {
            res.send(isChat[0]);
        } else {
            var chatData = {
                chatName: 'sender',
                users: [searchedUserID, userID],
            }

            const createdChat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", PUBLIC_FIELDS)
            res.status(200).send(fullChat)
        }
    } catch (err) {
        next(err);
    }
});

// Lists the signed-in user's chats. The `:userID` path segment is kept for compatibility
// but ignored; you can only list your own chats.
router.get('/fetchChats/:userID', requireAuth, async (req, res, next) => {
    try {
        let results = await Chat.find({ users: { $elemMatch: { $eq: req.currentUser._id } } })
            .populate("users", PUBLIC_FIELDS)
            .populate("latestMessage")
            .sort({ updatedAt: -1 });

        results = await User.populate(results, {
            path: 'latestMessage.sender',
            select: 'userName profileImage'
        });

        // How many messages from the other person the user hasn't seen, per conversation.
        const me = req.currentUser._id;
        const unread = await Message.aggregate([
            { $match: { chat: { $in: results.map((c) => c._id) }, sender: { $ne: me }, readBy: { $ne: me } } },
            { $group: { _id: '$chat', count: { $sum: 1 } } },
        ]);
        const unreadByChat = new Map(unread.map((u) => [String(u._id), u.count]));

        res.status(200).send(results.map((chat) => {
            const json = chat.toJSON();
            delete json.lastEmailedAt;
            return { ...json, unreadCount: unreadByChat.get(String(chat._id)) || 0 };
        }));
    } catch (err) {
        next(err);
    }
});


module.exports = router;
