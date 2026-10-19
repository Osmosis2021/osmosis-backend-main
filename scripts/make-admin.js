// Gives a Studio Time team member access to the admin tools (setting up artists for outreach).
//
//   MONGOOSE_CONNECTION_STRING="mongodb+srv://..." node scripts/make-admin.js you@example.com
//   ... node scripts/make-admin.js you@example.com --remove     (takes it away again)
//
// Run it against the production database from your own machine. The app never sets this itself.
const mongoose = require('mongoose');
const User = require('../models/user');

(async () => {
    const [email, flag] = process.argv.slice(2);
    const uri = process.env.MONGOOSE_CONNECTION_STRING;
    if (!email || !uri) {
        throw new Error('Usage: MONGOOSE_CONNECTION_STRING="..." node scripts/make-admin.js <email> [--remove]');
    }
    await mongoose.connect(uri);
    const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({ email: { $regex: `^${escaped}$`, $options: 'i' } });
    if (!user) {
        await mongoose.disconnect();
        throw new Error(`No account with the email ${email}. Sign up first, then run this again.`);
    }
    const isAdmin = flag !== '--remove';
    await User.updateOne({ _id: user._id }, isAdmin ? { $set: { isAdmin: true } } : { $unset: { isAdmin: 1 } });
    console.log(`${user.firstName} ${user.lastName} (@${user.userName}) ${isAdmin ? 'is now a Studio Time admin' : 'is no longer an admin'}. Sign out and back in to see the change.`);
    await mongoose.disconnect();
})().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
});
