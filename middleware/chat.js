const router = require('express').Router()
const User = require('../models/user');
const Chat = require('../models/chat');
const jwt = require('jsonwebtoken');
const jwtSecret = 'randomString';

router.get('/allUsers', async (req, res) => {
    const {token} = req.cookies;
    const keyword = req.query.search
    console.log('keyword...', keyword)
    // Verify the JWT token to get user data
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            // Handle token verification error (e.g., invalid token)
            return res.status(401).json({ error: 'Unauthorized' });
        }
            // Define the search filter based on the presence of the keyword
            const filter = keyword
            ? {
                $or: [
                    { userName: {$regex: keyword, $options: 'i'} },
                    { email: {$regex: keyword, $options: 'i'} }
                ],
            }
            : {};
        // Exclude the currently logged-in user from the search results
        const users = await User.find({ ...filter, _id: { $ne: userData._id } });
        res.send(users)
    });
});


router.get('/accessChats/:searchedUserID', async (req, res) => {
    const {searchedUserID} = req.params
    const {userID} = req.query
    console.log('in accessChats route with this searchedUsers userID', searchedUserID)
    console.log('in accessChats route with this loggedIn users userID', userID)

    if (!userID) {
        console.log('User id param not sent with request')
        return res.sendStatus(400)
    }

        var isChat = await Chat.find({
            $and: [
                {users:{$elemMatch:{ $eq: searchedUserID }}},
                {users:{$elemMatch:{$eq:userID}}},
            ],
        }).populate("users", "-password").populate("latestMessage")

        isChat = await User.populate(isChat, {
            path: 'latestMessage.sender',
            select: 'userName, profileImage, email'
        });

        if (isChat.length > 0) {
            res.send(isChat[0]);
        } else {
            var chatData = {
                chatName: 'sender',
                users: [searchedUserID, userID],
            };

        try {
            const createdChat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password")
            res.status(200).send(fullChat)
        } catch (err) {
            res.status(400);
            throw new Error(err.message);
        }
    }
});

router.get('/fetchChats/:userID', async (req, res) => {
    const {userID} = req.params
    console.log('in fetchChats Route with this userID', userID)

    // Verify the JWT token to get user data
  jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
    if (err) {
      // Handle token verification error (e.g., invalid token)
      return res.status(401).json({ error: 'Unauthorized' });
    }

        try {
            Chat.find({users:{$elemMatch: { $eq: userID }}})
            .populate("users", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: 'latestMessage.sender',
                    select: 'userName, profileImage, email'
                });

                res.status(200).send(results);
            });
        } catch (err) {
            res.status(400);
            throw new Error(err.message);
        }
    })
});


module.exports = router;
