const Message = require('../models/message');
const Chat = require('../models/chat');
const User = require('../models/user');
const emailService = require('./emailService');
const env = require('../config/env');
const guestAccountService = require('./guestAccountService');

/**
 * Emails people about messages they haven't read: once a message has sat unread for
 * UNREAD_DELAY, and at most once per conversation per EMAIL_GAP. Messages older than
 * LOOKBACK are left alone (so nobody gets a pile of emails about old conversations).
 */
const UNREAD_DELAY_MS = 10 * 60 * 1000;
const EMAIL_GAP_MS = 60 * 60 * 1000;
const LOOKBACK_MS = 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 5 * 60 * 1000;

const escapeHtml = (text) => String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const snippet = (text, max = 160) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

const sendUnreadMessageEmails = async (now = new Date()) => {
    const pending = await Message.find({
        createdAt: { $lte: new Date(now.getTime() - UNREAD_DELAY_MS), $gte: new Date(now.getTime() - LOOKBACK_MS) },
        emailNotifiedAt: { $exists: false },
    }).sort({ createdAt: 1 }).limit(1000);
    if (!pending.length) return 0;

    // Group by conversation, then by who hasn't read them.
    const byChat = new Map();
    pending.forEach((m) => {
        const key = String(m.chat);
        if (!byChat.has(key)) byChat.set(key, []);
        byChat.get(key).push(m);
    });

    let sent = 0;
    for (const [chatId, messages] of byChat) {
        try {
            const chat = await Chat.findById(chatId);
            if (!chat) continue;
            for (const recipientId of chat.users.map(String)) {
                const unread = messages.filter((m) => String(m.sender) !== recipientId && !m.readBy.map(String).includes(recipientId));
                if (!unread.length) continue;

                const last = chat.lastEmailedAt?.get(recipientId);
                if (last && now.getTime() - new Date(last).getTime() < EMAIL_GAP_MS) continue;

                // Claim these messages first so a second server running this can't email too.
                const ids = unread.map((m) => m._id);
                const claimed = await Message.updateMany({ _id: { $in: ids }, emailNotifiedAt: { $exists: false } }, { $set: { emailNotifiedAt: now } });
                if (!(claimed.modifiedCount ?? claimed.nModified)) continue;
                await Chat.updateOne({ _id: chat._id }, { $set: { [`lastEmailedAt.${recipientId}`]: now } });

                const [recipient, sender] = await Promise.all([
                    User.findById(recipientId),
                    User.findById(unread[unread.length - 1].sender).select('firstName lastName'),
                ]);
                if (!recipient?.email) continue;
                const senderName = [sender?.firstName, sender?.lastName].filter(Boolean).join(' ') || 'Someone';
                const link = guestAccountService.claimLinkFor(recipient, { next: '/chat' })
                    || `${env.FRONTEND_URL || 'https://getstudiotime.com'}/chat`;
                const more = unread.length > 1 ? `<p style="color:#666">and ${unread.length - 1} more ${unread.length === 2 ? 'message' : 'messages'}</p>` : '';

                await emailService.sendEmail({
                    sendTo: recipient.email,
                    replyTo: env.RESEND_FROM_EMAIL || undefined,
                    subject: `${sender?.firstName || 'Someone'} sent you a message on Studio Time`,
                    message: `
                        <p>Hi ${escapeHtml(recipient.firstName) || 'there'},</p>
                        <p><strong>${escapeHtml(senderName)}</strong> wrote:</p>
                        <blockquote style="margin:0;padding:8px 12px;border-left:3px solid #ddd">${escapeHtml(snippet(unread[unread.length - 1].content))}</blockquote>
                        ${more}
                        <p><a href="${link}"><strong>Reply in Studio Time</strong></a></p>
                        <p style="color:#666;font-size:12px">Replying to this email won't reach ${escapeHtml(sender?.firstName || 'them')}; use the link above.</p>
                    `,
                });
                sent += 1;
            }
        } catch (err) {
            console.error(`[message emails] chat ${chatId}:`, err.message);
        }
    }
    if (sent) console.log(`[message emails] sent ${sent}`);
    return sent;
};

/** Starts the check every few minutes (not in tests). */
const startMessageEmailJob = () => setInterval(
    () => sendUnreadMessageEmails().catch((err) => console.error('[message emails]', err.message)),
    CHECK_EVERY_MS
);

module.exports = { sendUnreadMessageEmails, startMessageEmailJob };
