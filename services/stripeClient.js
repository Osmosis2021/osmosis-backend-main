const Stripe = require('stripe');
const env = require('../config/env');

let stripeKey = '';
if (env.NODE_ENV === 'production') {
    stripeKey = env.STRIPE_LIVE_KEY;
} else {
    stripeKey = env.STRIPE_TEST_KEY;
}

const stripe = Stripe(stripeKey);

module.exports = stripe;
