const mongoose = require('mongoose');
const User = require('./user');
const Message = require('./message');

const ChatSchema = new mongoose.Schema({
    
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],

    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    },

    chatName: { 
        type: String, 
        trim: true 
    },

    // When each participant was last emailed about unread messages here (user id -> date),
    // so a busy conversation sends at most one email an hour.
    lastEmailedAt: {
        type: Map,
        of: Date,
        default: undefined,
    },
}, 

{
    timestamps: true
}
);

const Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;