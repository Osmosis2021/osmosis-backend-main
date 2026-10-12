const mongoose = require('mongoose');
const User = require('./user');
const Chat = require('./chat');

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    // People (other than the sender) who have seen this message.
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Set once the recipient has been emailed about it (so they're never emailed twice).
    emailNotifiedAt: { type: Date },
}, {
    // createdAt is the time shown next to each message. Older messages don't have it.
    timestamps: true,
});

MessageSchema.index({ chat: 1, createdAt: 1 });

const Message = mongoose.model('Message', MessageSchema);
module.exports = Message;
