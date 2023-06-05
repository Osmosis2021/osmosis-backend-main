const router = require('express').Router()
const Stripe = require('stripe');
const Course = require('../models/course');
const Booking = require('../models/booking');
const express = require('express');
const bodyParser = require('body-parser');
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51NEDr1EXMtM9g584HjgedDTZJQK6VCS810wg1mhHV4PigyXkFv2js5E8FSF7gEvqERXpAihzdEQdars4D7GyxlI600TaSVvn2v';
const STRIPE_WEBHOOK_SECRET = 'whsec_78e5b3362715eaa336fb1812d63371407efab34c48565079771b0ad141ad74a0'
const CLIENT_URL = 'http://localhost:3000';

// const stripe = Stripe(process.env.STRIPE_API_TEST_KEY);
    const stripe = Stripe('sk_test_51NEDr1EXMtM9g5843QsnEpiIAtZU9jFQ8kXabGCCDuapFuYR79weeKf14YFSY7PlLBtDcSFRm2Oz5D21zJQKogKe00I53AamYY');
    

    router.get('/config', (req, res) => {
        res.send({
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        });
    });

    router.post('/create-payment-intent', async(req, res) => {
        const { amount, capacity, metadata} = req.body
        console.log('in create-payment-intent route with this request:', amount * capacity, metadata)
    
        const paymentIntent = await stripe.paymentIntents.create({
            amount: (amount * capacity) * 100,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: metadata,
            // application_fee_amount: 123,
        })

        console.log(paymentIntent);
            
        // Return client secret to frontend
        res.send({ paymentIntent, clientSecret: paymentIntent.client_secret })
    });

    


module.exports = router;