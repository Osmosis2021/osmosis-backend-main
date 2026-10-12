/* eslint-env jest */
// Messaging: timestamps, unread counts, marking as read, and email about unread messages.
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/stripeClient');
jest.mock('cloudinary');
jest.mock('../services/emailService', () => ({
    makePasswordResetCode: jest.fn(() => '123456'),
    sendEmail: jest.fn().mockResolvedValue({ id: 'mock' }),
}));

const emailService = require('../services/emailService');
const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');
const { sendUnreadMessageEmails } = require('../services/messageNotificationService');

let mongoServer;
let app;
let lena;
let gia;
let chat;

const tokenFor = (user) => jwt.sign({ userName: user.userName }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
const as = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });
const minutesAgo = (m) => new Date(Date.now() - m * 60000);

const send = (from, content) => request(app).post('/message/sendMessage').set(as(from)).send({ chatId: String(chat._id), content });

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = express();
    app.use(express.json());
    app.use('/chat', require('../routes/chat.routes'));
    app.use('/message', require('../routes/message.routes'));
    app.use(require('../middleware/errorHandler'));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Chat.deleteMany({}), Message.deleteMany({})]);
    jest.clearAllMocks();
    lena = await User.create({ firstName: 'Lena', lastName: 'Ortiz', userName: 'lenaortiz', email: 'lena@example.com', password: 'x', isTeacher: true });
    gia = await User.create({ firstName: 'Gia', lastName: 'Park', userName: 'giapark', email: 'gia@example.com', password: 'x', isStudent: true });
    chat = await Chat.create({ chatName: 'sender', users: [lena._id, gia._id] });
});

describe('Messages', () => {
    it('have a time and the sender name', async () => {
        const res = await send(gia, 'Hi! Is parking easy?').expect(200);
        expect(res.body.createdAt).toBeTruthy();
        expect(res.body.sender.firstName).toBe('Gia');
    });

    it('count as unread for the other person until they open the conversation', async () => {
        await send(gia, 'Hi!').expect(200);
        await send(gia, 'Also, can I bring a friend?').expect(200);

        const forLena = await request(app).get('/chat/fetchChats/x').set(as(lena)).expect(200);
        expect(forLena.body[0].unreadCount).toBe(2);
        const forGia = await request(app).get('/chat/fetchChats/x').set(as(gia)).expect(200);
        expect(forGia.body[0].unreadCount).toBe(0); // your own messages are never unread
        expect(forLena.body[0].lastEmailedAt).toBeUndefined();

        await request(app).post(`/message/read/${chat._id}`).set(as(lena)).expect(200);
        const after = await request(app).get('/chat/fetchChats/x').set(as(lena)).expect(200);
        expect(after.body[0].unreadCount).toBe(0);
    });

    it("can't be marked read by someone outside the conversation", async () => {
        const outsider = await User.create({ firstName: 'Max', lastName: 'Lee', userName: 'maxlee', email: 'max@example.com', password: 'x' });
        await request(app).post(`/message/read/${chat._id}`).set(as(outsider)).expect(403);
    });

    it('come back oldest first', async () => {
        await send(gia, 'one').expect(200);
        await send(lena, 'two').expect(200);
        const res = await request(app).get(`/message/allMessages/${chat._id}`).set(as(gia)).expect(200);
        expect(res.body.map((m) => m.content)).toEqual(['one', 'two']);
        expect(res.body[0].emailNotifiedAt).toBeUndefined();
    });
});

describe('Email about unread messages', () => {
    const message = (from, content, createdAt, extra = {}) => Message.create({ sender: from._id, chat: chat._id, content, createdAt, updatedAt: createdAt, ...extra });

    it('emails once a message has been unread for 10 minutes, then not again', async () => {
        await message(gia, 'Is parking easy?', minutesAgo(5));
        expect(await sendUnreadMessageEmails()).toBe(0); // too soon

        await Message.collection.updateMany({}, { $set: { createdAt: minutesAgo(12) } }); // the model won't rewrite createdAt
        expect(await sendUnreadMessageEmails()).toBe(1);
        const [email] = emailService.sendEmail.mock.calls[0];
        expect(email.sendTo).toBe('lena@example.com');
        expect(email.subject).toBe('Gia sent you a message on Studio Time');
        expect(email.message).toContain('Is parking easy?');
        expect(email.message).toContain('/chat');

        expect(await sendUnreadMessageEmails()).toBe(0);
    });

    it("doesn't email about messages already read", async () => {
        await message(gia, 'Hi', minutesAgo(15), { readBy: [lena._id] });
        expect(await sendUnreadMessageEmails()).toBe(0);
    });

    it('sends at most one email an hour per conversation, and sums up several messages', async () => {
        await message(gia, 'first', minutesAgo(30));
        await message(gia, 'second', minutesAgo(20));
        expect(await sendUnreadMessageEmails()).toBe(1);
        expect(emailService.sendEmail.mock.calls[0][0].message).toMatch(/second[\s\S]*and 1 more message/);

        await message(gia, 'third', minutesAgo(11));
        expect(await sendUnreadMessageEmails()).toBe(0); // emailed under an hour ago
    });

    it('leaves day-old messages alone', async () => {
        await message(gia, 'old', minutesAgo(60 * 30));
        expect(await sendUnreadMessageEmails()).toBe(0);
    });

    it('gives guests who booked without an account a set-password link', async () => {
        await User.updateOne({ _id: lena._id }, { passwordSetupRequired: true });
        await message(gia, 'Hi', minutesAgo(15));
        await sendUnreadMessageEmails();
        expect(emailService.sendEmail.mock.calls[0][0].message).toMatch(/claim-account\?token=.*next=%2Fchat/);
    });
});
