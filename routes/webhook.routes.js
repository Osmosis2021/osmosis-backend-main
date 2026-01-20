const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Match the exact middleware from index.js: express.raw({ type: 'application/json' })
router.post('/webhook', express.raw({ type: 'application/json' }), webhookController.handleWebhook);

module.exports = router;
