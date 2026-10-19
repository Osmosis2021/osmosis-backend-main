const router = require('express').Router()
const mongoose = require('mongoose');
const User = require('../models/user');
const Course = require('../models/course');
const CourseTimeslot = require('../models/courseTimeslot');
const stripe = require('../services/stripeClient');
const { requireAuth, optionalAuth, authIfPresent, requireTeacher, blockWhileActing } = require('../middleware/auth');
const payoutService = require('../services/payoutService');
const { INACTIVE_STATUSES, effectiveStartAt } = require('../services/sessionTime');
const { parseGuestDetails } = require('../services/guestAccountService');


router.get('/config', (req, res) => {
    res.send({ publishableKey: stripe.publishableKey, mode: stripe.stripeMode });
});

const isOwnStripeAccount = (req, stripeID) => Boolean(req.currentUser?.stripeID) && req.currentUser.stripeID === stripeID;

// HOST PAYOUTS (Stripe Express)
// Each call works on the signed-in host's own account only.

const sendPayoutError = (res, next) => (err) => {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[payouts]', err);
    return next(err);
};

// Where the host is in Stripe onboarding: not_started | in_progress | action_needed | pending_review | ready
router.get('/payouts/status', requireAuth, requireTeacher, async (req, res, next) => {
    try {
        res.json(await payoutService.getPayoutStatus(req.currentUser));
    } catch (err) {
        sendPayoutError(res, next)(err);
    }
});

// Link to Stripe's hosted onboarding (creates the host's Stripe account first if needed).
router.post('/payouts/onboarding-link', requireAuth, requireTeacher, blockWhileActing, async (req, res, next) => {
    try {
        res.json({ url: await payoutService.createOnboardingLink(req.currentUser) });
    } catch (err) {
        sendPayoutError(res, next)(err);
    }
});

// One-time sign-in link to the host's Stripe Express Dashboard.
router.post('/payouts/dashboard-link', requireAuth, requireTeacher, blockWhileActing, async (req, res, next) => {
    try {
        res.json({ url: await payoutService.createDashboardLink(req.currentUser) });
    } catch (err) {
        sendPayoutError(res, next)(err);
    }
});

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
// Signed-in guests pay as themselves. Anyone else checks out with just name + email
// (`guest: { firstName, lastName, email }`); their account is set up once the payment succeeds.
router.post('/create-payment-intent', authIfPresent, async (req, res) => {
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

        if (!mongoose.isValidObjectId(timeslotID)) {
            return res.status(400).json({ error: 'Please choose a session.' });
        }
        const timeslot = await CourseTimeslot.findOne({ _id: timeslotID, courseID: course._id });
        if (!timeslot || INACTIVE_STATUSES.includes(timeslot.status)) {
            return res.status(404).json({ error: 'This session is no longer available.' });
        }
        const startsAt = effectiveStartAt(timeslot, course.timezone);
        if (startsAt && startsAt.getTime() <= Date.now()) {
            return res.status(409).json({ error: 'This session has already started.' });
        }
        const spotsLeft = (timeslot.capacity || 1) - (timeslot.enrollment || 0);
        if (guests > spotsLeft) {
            return res.status(409).json({ error: 'Sorry, there are not enough spots left in this session.' });
        }

        const host = await User.findById(course.teacherID);
        if (!host?.stripeID) {
            return res.status(400).json({ error: "This artist hasn't enabled payments yet." });
        }

        const unitAmountCents = Math.round(Number(course.pricePerStudent || 0) * 100);
        const totalCents = unitAmountCents * guests;
        if (!totalCents || totalCents < 50) {
            return res.status(400).json({ error: 'This studio time does not have a valid price.' });
        }

        // Hosts can only take bookings once Stripe can pay them out. An account Stripe doesn't know
        // (e.g. one made in test mode, now that we're live) means they still need to set up payouts.
        let stripeAccountData = null;
        try {
            stripeAccountData = await stripe.accounts.retrieve(host.stripeID);
        } catch (err) {
            if (!payoutService.isMissingAccountError(err)) throw err;
        }
        const payoutsEnabled = await payoutService.syncPayoutsFlag(host, stripeAccountData)
        if (!payoutsEnabled) {
            return res.status(409).json({ error: "This artist is still setting up payments, so this session can't be booked yet. Check back soon!" });
        }
        const destinationAccount = host.stripeID

        const signedInGuest = req.currentUser;
        let guestDetails = null;
        if (!signedInGuest) {
            try {
                guestDetails = parseGuestDetails(req.body.guest);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        }

        let paymentIntentOptions = {
            amount: totalCents,
            currency: 'usd',
            metadata: {
                courseID: String(course._id),
                timeslotID: String(timeslot._id),
                guests: String(guests),
                teacherUserName: course.userName || '',
                studentUserName: signedInGuest ? signedInGuest.userName : '',
                ...(guestDetails && {
                    guestEmail: guestDetails.email,
                    guestFirstName: guestDetails.firstName,
                    guestLastName: guestDetails.lastName,
                }),
                date: timeslot.startDate ? timeslot.startDate.toISOString().split('T')[0] : '',
                time: timeslot.startTime || '',
            },
            application_fee_amount: applicationFeeFor(totalCents),
            transfer_data: {
                destination: destinationAccount,
            },
        }
        const receiptEmail = signedInGuest ? signedInGuest.email : guestDetails.email;
        if (receiptEmail) paymentIntentOptions.receipt_email = receiptEmail;
        // Saved card and customer belong to the signed-in guest only.
        if (signedInGuest?.paymentMethodID) paymentIntentOptions.payment_method = signedInGuest.paymentMethodID;
        if (signedInGuest?.customerStripeID) paymentIntentOptions.customer = signedInGuest.customerStripeID;

        let paymentIntent;
        try {
            paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
        } catch (err) {
            // A saved card or Stripe customer from the other mode (test vs live) doesn't exist here:
            // take the payment without them rather than failing checkout.
            const staleSavedCard = err?.code === 'resource_missing' && ['customer', 'payment_method'].includes(err?.param);
            if (!staleSavedCard) throw err;
            console.warn(`[checkout] Ignoring saved ${err.param} for ${signedInGuest?.userName}: not found in ${stripe.stripeMode} mode.`);
            delete paymentIntentOptions.customer;
            delete paymentIntentOptions.payment_method;
            paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
        }
        // Return client secret to frontend
        res.send({ clientSecret: paymentIntent.client_secret, paymentIntentID: paymentIntent.id, amount: totalCents })

    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});


module.exports = router;
