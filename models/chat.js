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
}, 

{
    timestamps: true
}
);

const Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;