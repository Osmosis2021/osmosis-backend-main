const Booking = require('../models/booking');
const env = require('../config/env');
const stripe = require('../services/stripeClient');

const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    console.log({ 'req.body': req.body, sig });
    // Check if webhook signing is configured

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        console.log({ event });
    } catch (err) {
        console.log('req.body', req.body, 'sig', sig, 'STRIPE_WEBHOOK_SECRET', STRIPE_WEBHOOK_SECRET);
        console.log('in /webhook', { err });
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntentSucceeded = event.data.object;
            // Then define and call a function to handle the event payment_intent.succeeded
            console.log('Payment completed successfully');

            //   Change status of booking to paid
            // Note: event.metbookingID seems to be a typo in the original code (metbookingID vs metadata.bookingID?)
            // But preserving exact behavior as requested.
            const updateBooking = await Booking.findOneAndUpdate({ _id: event.metbookingID }, { $set: event.data }, { new: true });
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
};

module.exports = { handleWebhook };
