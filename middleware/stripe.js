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

const stripe = Stripe(process.env.STRIPE_LIVE_KEY)

    router.get('/config', (req, res) => {
        res.send({
        publishableKey: process.env.STRIPE_PUBLISHABLE_LIVE_KEY,
        });
    });

    // ACCOUNT LINK
    router.get('/accountLink/:stripeID', async (req, res) => {
        
        const {stripeID} = req.params;
        console.log('stripeID', stripeID)
        const accountLink = await stripe.accountLinks.create({
            account: stripeID,
            refresh_url: 'https://getosmosis.io/reauth',
            return_url: 'https://getosmosis.io/flow',
            type: 'account_onboarding',
        });
        // res.redirect(accountLink)
        res.json(accountLink)
        
    })

    // RETRIEVING STRIPE ACCOUNT 


    router.get('/retrieveStripeAccount/:stripeID', async (req, res) => {
        
        const {stripeID} = req.params;
        console.log('inside retrieveStripeAccount with this ID:', stripeID)
        const retrieveAccount = await stripe.accounts.retrieve(stripeID);
        // const balance = await stripe.balance.retrieve({});
          
        const stripeObj = {
            retrieveAccount: retrieveAccount,
            // balanace: balance            
        }
        res.json(stripeObj)
        
    })

    // STUDENT PAYING FOR COURSE vvvvvv

    router.post('/create-payment-intent', async(req, res) => {
        const { amount, capacity, metadata, stripeID} = req.body
        console.log('in create-payment-intent route with this request:', amount * capacity, metadata, stripeID)
        console.log('app fee:', Math.round(amount * capacity * 9.9) + 30)
    
        const paymentIntent = await stripe.paymentIntents.create({
            amount: (amount * capacity) * 100,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: metadata,
            application_fee_amount: Math.round(amount * capacity * 9.9) + 30,
            transfer_data: {
                destination: stripeID,
              },
        })

        console.log(paymentIntent);
            
        // Return client secret to frontend
        res.send({ paymentIntent, clientSecret: paymentIntent.client_secret })
        console.log(paymentIntent.client_secret)
    });

    


module.exports = router;