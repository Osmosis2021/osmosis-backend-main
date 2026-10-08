const router = require('express').Router()
const mongoose = require('mongoose');
const User = require('../models/user');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const env = require('../config/env');
const stripe = require('../services/stripeClient');
const { requireAuth, optionalAuth } = require('../middleware/auth');

let stripePublishableKey = ''
if (env.NODE_ENV === 'production') {
    stripePublishableKey = env.STRIPE_PUBLISHABLE_KEY
} else {
    stripePublishableKey = env.STRIPE_PUBLISHABLE_TEST_KEY
}

// Platform account that holds payments for hosts who have not finished Stripe onboarding.
const UNONBOARDED_HOST_HOLDING_ACCOUNT = 'acct_1OnmPHI0y4kZR3uX';

router.get('/config', (req, res) => {
    res.send({ publishableKey: stripePublishableKey, });
});

const isOwnStripeAccount = (req, stripeID) => Boolean(req.currentUser?.stripeID) && req.currentUser.stripeID === stripeID;

// ACCOUNT LINK
// Onboarding links let someone edit payout details, so only the account owner can get one.
router.get('/accountLink/:stripeID', requireAuth, async (req, res, next) => {
    try {
        const { stripeID } = req.params;
        if (!isOwnStripeAccount(req, stripeID)) {
            return res.status(403).json({ message: 'You can only manage your own payout account.' });
        }
        const accountLink = await stripe.accountLinks.create({
            account: stripeID,
            refresh_url: 'https://getstudiotime.com/reauth',
            return_url: `https://getstudiotime.com/explore`,
            type: 'account_onboarding',
        });
        res.json(accountLink)
    } catch (error) {
        next(error);
    }
})

// RETRIEVING STRIPE ACCOUNT
// The owner gets the full account; anyone else only learns whether the host can take payments.
router.get('/retrieveStripeAccount/:stripeID', optionalAuth, async (req, res) => {
    const { stripeID } = req.params;
    try {
        const retrieveAccount = await stripe.accounts.retrieve(stripeID);
        if (isOwnStripeAccount(req, stripeID)) {
            return res.json({ retrieveAccount });
        }
        res.json({
            retrieveAccount: {
                payouts_enabled: Boolean(retrieveAccount?.payouts_enabled),
                charges_enabled: Boolean(retrieveAccount?.charges_enabled),
            }
        })
    } catch (error) {
        console.error(error);
        res.json({ message: 'An error occurred while retrieving the Stripe account' });
    }
})


// Stripe Customer Account (saved card summary for the signed-in user)
router.get('/retrieveStripeCustomerAccount/:customerStripeID', requireAuth, async (req, res) => {
    const { customerStripeID } = req.params;
    try {
        const user = req.currentUser;
        if (!user.customerStripeID || user.customerStripeID !== customerStripeID) {
            return res.status(403).json({ message: 'You can only view your own payment methods.' });
        }
        if (user.paymentMethodID) {
            // Retrieve the payment method using the stored paymentMethod in mongoDB
            const paymentMethod = await stripe.paymentMethods.retrieve(user.paymentMethodID)
            res.json({ card: paymentMethod.card });
        } else {
            res.json({ message: 'No payment method associated with the user.' });
        }

    } catch (error) {
        console.error('Error retrieving payment method:', error)
        res.status(500).json({ message: 'Could not load your saved payment method.' });
    }
})

// Saving Customer Payment Method
router.post('/save-payment-method/:customerStripeID', requireAuth, async (req, res) => {
    const { customerStripeID } = req.params;
    const { paymentMethodID } = req.body;

    if (!req.currentUser.customerStripeID || req.currentUser.customerStripeID !== customerStripeID) {
        return res.status(403).json({ error: 'You can only save payment methods to your own account.' });
    }

    try {
        const attachedPaymentMethod = await stripe.paymentMethods.attach(
            paymentMethodID, { customer: customerStripeID }
        )

        // NOTE: `paymentMethod` is not a field on the User schema, so this write is dropped by
        // Mongoose (pre-existing behaviour, left unchanged in this security pass).
        await User.findOneAndUpdate(
            { customerStripeID },
            { $set: { paymentMethod: paymentMethodID } },
            { new: true }
        )

        res.json({ attachedPaymentMethod });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save payment method' });
    }
}
);

// Studio Time keeps 9.9% + $0.30 of each booking.
const applicationFeeFor = (totalCents) => Math.round(totalCents * 0.099) + 30;

// STUDENT PAYING FOR COURSE
// The client says *what* it is booking (course, session, number of guests). The price,
// the host's payout account and the guest's Stripe customer are all looked up here, so
// the amount or destination cannot be changed from the browser.
router.post('/create-payment-intent', requireAuth, async (req, res) => {
    const { courseID, timeslotID } = req.body
    // `capacity` is the legacy name the checkout used for the number of guests.
    const guests = Number(req.body.guests ?? req.body.capacity)

    try {
        if (!mongoose.isValidObjectId(courseID)) {
            return res.status(400).json({ error: 'Missing studio time.' });
        }
        if (!Number.isInteger(guests) || guests < 1) {
            return res.status(400).json({ error: 'Please choose at least one guest.' });
        }

        const course = await Course.findById(courseID);
        if (!course) {
            return res.status(404).json({ error: 'This studio time no longer exists.' });
        }

        let timeslot = null;
        if (timeslotID) {
            if (!mongoose.isValidObjectId(timeslotID)) {
                return res.status(400).json({ error: 'Please choose a session.' });
            }
            timeslot = await CourseTimeslot.findOne({ _id: timeslotID, courseID: course._id });
            if (!timeslot) {
                return res.status(404).json({ error: 'This session is no longer available.' });
            }
            const spotsLeft = (timeslot.capacity || 1) - (timeslot.enrollment || 0);
            if (guests > spotsLeft) {
                return res.status(409).json({ error: 'Sorry, there are not enough spots left in this session.' });
            }
        }

        const host = await User.findById(course.teacherID).select('stripeID');
        if (!host?.stripeID) {
            return res.status(400).json({ error: "This artist hasn't enabled payments yet." });
        }

        const unitAmountCents = Math.round(Number(course.pricePerStudent || 0) * 100);
        const totalCents = unitAmountCents * guests;
        if (!totalCents || totalCents < 50) {
            return res.status(400).json({ error: 'This studio time does not have a valid price.' });
        }

        // Retrieve account info and determine if onboarded (payouts enabled)
        const stripeAccountData = await stripe.accounts.retrieve(host.stripeID)
        const payoutsEnabled = stripeAccountData?.payouts_enabled
        const destinationAccount = payoutsEnabled ? host.stripeID : UNONBOARDED_HOST_HOLDING_ACCOUNT

        const guest = req.currentUser;
        let paymentIntentOptions = {
            amount: totalCents,
            currency: 'usd',
            metadata: {
                courseID: String(course._id),
                timeslotID: timeslot ? String(timeslot._id) : '',
                guests: String(guests),
                teacherUserName: course.userName || '',
                studentUserName: guest.userName,
                date: timeslot?.startDate ? timeslot.startDate.toISOString().split('T')[0] : '',
                time: timeslot?.startTime || '',
            },
            application_fee_amount: applicationFeeFor(totalCents),
            transfer_data: {
                destination: destinationAccount,
            },
        }
        if (guest.email) paymentIntentOptions.receipt_email = guest.email;
        // Saved card and customer belong to the signed-in guest only.
        if (guest.paymentMethodID) paymentIntentOptions.payment_method = guest.paymentMethodID;
        if (guest.customerStripeID) paymentIntentOptions.customer = guest.customerStripeID;

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions)
        // Return client secret to frontend
        res.send({ clientSecret: paymentIntent.client_secret, amount: totalCents })

    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});


module.exports = router;
