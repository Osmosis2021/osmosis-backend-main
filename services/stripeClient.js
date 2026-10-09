const Stripe = require('stripe');
const env = require('../config/env');

// Test or live mode. STRIPE_MODE wins; otherwise live in production, test everywhere else.
const stripeMode = env.STRIPE_MODE || (env.NODE_ENV === 'production' ? 'live' : 'test');

const stripeKey = stripeMode === 'live' ? env.STRIPE_LIVE_KEY : env.STRIPE_TEST_KEY;
const publishableKey = stripeMode === 'live'
    ? (env.STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLISHABLE_LIVE_KEY)
    : env.STRIPE_PUBLISHABLE_TEST_KEY;

if (env.NODE_ENV !== 'test') {
    if (!stripeKey) {
        console.error(`⚠️  Stripe is in ${stripeMode} mode but ${stripeMode === 'live' ? 'STRIPE_LIVE_KEY' : 'STRIPE_TEST_KEY'} is not set. Payments and host payouts will not work.`);
    } else {
        console.log(`Stripe: ${stripeMode} mode`);
    }
}

const stripe = Stripe(stripeKey || '');

module.exports = stripe;
module.exports.stripeMode = stripeMode;
module.exports.publishableKey = publishableKey;
module.exports.isConfigured = Boolean(stripeKey);
