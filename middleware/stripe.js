const router = require('express').Router()
const Stripe = require('stripe');
const User = require('../models/user');
let stripeKey = ''
if (process.env.NODE_ENV === 'production') {
    stripeKey = process.env.STRIPE_LIVE_KEY
} else {
    stripeKey =  process.env.STRIPE_TEST_KEY
}
let stripePublishableKey = ''
if (process.env.NODE_ENV === 'production') {
    stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY
} else {
    stripePublishableKey =  process.env.STRIPE_PUBLISHABLE_TEST_KEY
}

const stripe = Stripe(stripeKey);

router.get('/config', (req, res) => {
    res.send({publishableKey: stripePublishableKey,});
});

// ACCOUNT LINK
router.get('/accountLink/:stripeID', async (req, res) => {
    const {stripeID} = req.params;
    const accountLink = await stripe.accountLinks.create({
        account: stripeID,
        refresh_url: 'https://getosmosis.io/reauth',
        return_url: `https://getosmosis.io/MapOpen`,
        type: 'account_onboarding',
    });
    // res.redirect(accountLink)
    res.json(accountLink)
})

// RETRIEVING STRIPE ACCOUNT 
router.get('/retrieveStripeAccount/:stripeID', async (req, res) => {
    const {stripeID} = req.params;
    console.log('inside retrieveStripeAccount with this ID:', stripeID)
    try {
        const retrieveAccount = await stripe.accounts.retrieve(stripeID);
        // const balance = await stripe.balance.retrieve({});
            
        const stripeObj = {
            retrieveAccount: retrieveAccount,
            // balanace: balance            
        }
        res.json(stripeObj)
    } catch (error) {
        console.error(error);
        res.json({ message: 'An error occurred while retrieving the Stripe account' });
    }
})


// Stripe Customer Account 
router.get('/retrieveStripeCustomerAccount/:customerStripeID', async (req, res) => {
    const {customerStripeID} = req.params; 
    console.log('inside retrieve StripeCustomer with this id:', customerStripeID)
    try {

        // Find user based on customerStripeID
        const user = await User.findOne({ customerStripeID });
        if (user && user.paymentMethodID) {
            // Retrieve the payment method using the stored paymentMethod in mongoDB
            const paymentMethod = await stripe.paymentMethods.retrieve(user.paymentMethodID)
            res.json({ card: paymentMethod.card });
        } else {
            res.json({ message: 'No payment method associated with the user.' });
        }

    } catch (error) {
        console.log('This is the error', error)
    }
})

// Saving Customer Payment Method
router.post('/save-payment-method/:customerStripeID', async (req, res) => {

    console.log('stripeKey', stripeKey)                                           
    const { customerStripeID } = req.params;
    const { paymentMethodID } = req.body;

    try {

        const attachedPaymentMethod = await stripe.paymentMethods.attach(
            paymentMethodID, { customer: customerStripeID }
        )

        // Save paymentMethodID in User schema 

            const user = await User.findOneAndUpdate(
                {customerStripeID}, 
                { $set: { paymentMethod: paymentMethodID } }, 
                { new: true }
            )

            res.json({ attachedPaymentMethod });

            // const setupIntent = await stripe.setupIntents.create({
            //     payment_method_types: ['card'],
            // });
            
            // const retrievePaymentMethod = await stripe.paymentMethods.retrieve(
            //     paymentMethodID
            // );

            // await stripe.customers.update(
            //     customerStripeID, { card: { default_payment_method: paymentMethodID } }
            // )
            

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to save payment method' });
        }
    }
);

// STUDENT PAYING FOR COURSE vvvvvv
router.post('/create-payment-intent', async(req, res) => {
    const { amount, capacity, metadata, stripeID, customerStripeID, paymentMethodID, email} = req.body
    console.log('this is the email address we got.........................................', email)
    console.log('in create-payment-intent route with this request:', amount * capacity, metadata, stripeID)
    console.log('this is the paymentMethodID:', paymentMethodID)
    console.log('this is the customerStripeID:', customerStripeID)
    // console.log('app fee:', Math.round(amount * capacity * 9.9) + 30)

    try {
        // Retrieve account info and determine if onboarded (payouts enabled)
        const stripeAccountData = await stripe.accounts.retrieve(stripeID)
        const payoutsEnabled = stripeAccountData?.payouts_enabled
        // Set destination account based on whether onboarded
        // This stripe account is our temp account to accept payments on behalf of our teachers --> acct_1OnmPHI0y4kZR3uX
        const destinationAccount = payoutsEnabled ? stripeID : 'acct_1OnmPHI0y4kZR3uX'
        let paymentIntentOptions = {
            amount: (amount * capacity) * 100,
            currency: 'usd',
            metadata: metadata,
            application_fee_amount: Math.round(amount * capacity * 9.9) + 30,
            transfer_data: {
                destination: destinationAccount,
                },
            // payment_method: paymentMethodID,
            // customer: customerStripeID,
            receipt_email: email,
        }
         // Include paymentMethodID only if it exists
        if (paymentMethodID) {
            paymentIntentOptions.payment_method = paymentMethodID;
        }
        if (customerStripeID) {
            paymentIntentOptions.customer = customerStripeID;
        }
        const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions)
        // Return client secret to frontend
        res.send({ clientSecret: paymentIntent.client_secret })

    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});


module.exports = router;