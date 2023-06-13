const router = require('express').Router()
const Stripe = require('stripe');
const Course = require('../models/course');
const Booking = require('../models/booking');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv')
dotenv.config()
const STRIPE_WEBHOOK_SECRET = 'whsec_78e5b3362715eaa336fb1812d63371407efab34c48565079771b0ad141ad74a0'
const CLIENT_URL = 'http://localhost:3000';

const stripe = Stripe(process.env.STRIPE_API_TEST_KEY)

    router.get('/config', (req, res) => {
        res.send({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
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