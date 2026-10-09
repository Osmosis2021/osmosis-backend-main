const env = require('../config/env');
const stripe = require('../services/stripeClient');
const bookingService = require('../services/bookingService');
const User = require('../models/user');

const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe webhook. On a successful payment, makes sure the booking exists. Normally checkout
 * creates it a moment earlier; this is the safety net for guests who pay and then close the
 * page or lose their connection before checkout finishes.
 */
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
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
            await User.updateOne({ stripeID: account.id }, { $set: { payoutsEnabled: Boolean(account.payouts_enabled) } })
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
