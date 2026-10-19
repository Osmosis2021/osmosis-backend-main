const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const adminService = require('../services/adminService');

// Studio Time team tools for setting up artists during outreach. Team members only.
router.use(requireAuth, requireAdmin);

const send = (handler) => async (req, res, next) => {
    try {
        res.json(await handler(req));
    } catch (err) {
        if (err.status) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

// Artist accounts the team has set up, with whether each has been claimed.
router.get('/artists', send(() => adminService.listArtists()));

// Set up a new artist account: { firstName, lastName, email, userName, description?, profileImage? (data URL) }.
router.post('/artists', send((req) => adminService.createArtist(req.currentUser, req.body)));

// Short-lived access to an unclaimed artist account, to build their profile and studio times.
router.post('/artists/:id/act', send((req) => adminService.actAsArtist(req.currentUser, req.params.id)));

// The "claim your studio" link; { sendEmail: true } also emails it to the artist.
router.post('/artists/:id/invite', send((req) => adminService.inviteArtist(req.currentUser, req.params.id, { sendEmail: Boolean(req.body?.sendEmail) })));

module.exports = router;
