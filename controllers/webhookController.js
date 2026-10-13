const env = require('../config/env');
const stripe = require('../services/stripeClient');
const bookingService = require('../services/bookingService');
const User = require('../models/user');

// Stripe signs each webhook endpoint with its own secret. There are two endpoints pointing here:
// one for our own account (payments) and one for connected artist accounts (payout setup).
const WEBHOOK_SECRETS = [env.STRIPE_WEBHOOK_SECRET, env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(Boolean);

const verifyEvent = (body, signature) => {
    let lastError = new Error('No Stripe webhook secret is configured.');
    for (const secret of WEBHOOK_SECRETS) {
        try {
            return stripe.webhooks.constructEvent(body, signature, secret);
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError;
};

/**
 * Stripe webhook. On a successful payment, makes sure the booking exists. Normally checkout
 * creates it a moment earlier; this is the safety net for guests who pay and then close the
 * page or lose their connection before checkout finishes.
 */
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = verifyEvent(req.body, sig);
    } catch (err) {
        console.error('[webhook] Signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            // Only payments made through Studio Time checkout carry these.
            if (!paymentIntent?.metadata?.courseID || !paymentIntent?.metadata?.timeslotID) break;
            try {
                const { created } = await bookingService.createBookingFromPayment(paymentIntent);
                if (created) console.log(`[webhook] Created booking for ${paymentIntent.id} (checkout didn't finish).`);
            } catch (err) {
                // Acknowledge anyway: retrying won't help, and any refund has already been attempted.
                console.error(`[webhook] Could not create booking for ${paymentIntent.id}:`, err.message);
            }
            break;
        }
        // A connected (host) account changed, e.g. finished onboarding or Stripe paused payouts.
        // Requires the webhook to also listen to events on connected accounts.
        case 'account.updated': {
            const account = event.data.object;
            await User.updateOne({ stripeID: account.id }, { $set: { payoutsEnabled: Boolean(account.payouts_enabled), payoutsMode: event.livemode ? 'live' : 'test' } })
                .catch((err) => console.error('[webhook] account.updated failed:', err.message));
            break;
        }
        default:
            break;
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
};

module.exports = { handleWebhook };
