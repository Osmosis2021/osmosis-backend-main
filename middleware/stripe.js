const router = require('express').Router()
const Stripe = require('stripe');
const Course = require('../models/course');
const Booking = require('../models/booking');
const express = require('express');
const bodyParser = require('body-parser');
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51MngVdIVE7cwgof9GzZJfeu7r3wQcv5vb42koFkURzk6VG6cdafDw9ZHDM5WvHxMbRFoJtlmBQnNnN8P8JNjcxJa00qdQ8gXta';
const STRIPE_WEBHOOK_SECRET = 'whsec_7678209e81e802bd027824c0f7224111874cd5b8aafda665330bdbabedc3027c'
const CLIENT_URL = 'http://localhost:3000';

// const stripe = Stripe(process.env.STRIPE_API_TEST_KEY);
    const stripe = Stripe('sk_test_51MngVdIVE7cwgof9pqeXfJrrTzTiw1ZAKnfvDse1CkAvawprEjj5qvJyYKSFRCw8mqtaNfBNs1nXCPsDpmdctuBJ00tp7CqaqK');
    

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

    router.post('/webhook', bodyParser.raw({type: 'application/json'}), async (req, res) => {
        const sig = req.headers['stripe-signature'];
        let event;
        // Check if webhook signing is configured

        try {
            event = stripe.webhooks.constructEvent(
                req.body, 
                sig, 
                STRIPE_WEBHOOK_SECRET,
                // Set the rawBody property to the raw request body
                {
                    rawBody: req.rawBody,
                })
        } catch (err) {
            console.log('req.body', req.body, 'sig', sig, 'STRIPE_WEBHOOK_SECRET', STRIPE_WEBHOOK_SECRET)
            console.log('in /webhook', {err})
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        // Handle the event
        
        switch(event.type) {
            case 'payment_intent.succeeded':
              const paymentIntentSucceeded = event.data.object;
              // Then define and call a function to handle the event payment_intent.succeeded
              console.log('Payment completed successfully')
            const booking = new Booking({
                        timestamp: timestamp,
                        studentID: userData.id,
                        numberOfGuests: numberOfGuests, 
                        courseTimeslotID: courseTimeslotID,
                        courseID: courseID,
                        total: total, 
                        teacherUserName: teacherUserName,
                        time: time,
                        date: date, 
                    });
    
                    await booking.save()
              break;
            // ... handle other event types
            default:
              console.log(`Unhandled event type ${event.type}`);
          }

          // Return a 200 response to acknowledge receipt of the event
            res.send();
        
        });


        // if (STRIPE_WEBHOOK_SECRET) {
        //     let event;
        //     let signature = req.headers['stripe-signature'];
        //     try {
        //         event = stripe.webhooks.constructEvent(
        //             req.rawBody,
        //             signature, 
        //             STRIPE_WEBHOOK_SECRET
        //         );
        //     } catch (err) {
        //         console.log('webhook verification failed');
        //         return res.sendStatus(400);
        //     }
        //     data = event.data;
        //     eventType = event.type
        // } else  {
        //     data = req.body.data
        //     eventType = req.body.type
        // }

        // if (eventType === 'payment_intent.succeeded') {
        //     console.log('Payment completed successfully')
        //     const booking = new Booking({
        //                 timestamp: timestamp,
        //                 studentID: userData.id,
        //                 numberOfGuests: numberOfGuests, 
        //                 courseTimeslotID: courseTimeslotID,
        //                 courseID: courseID,
        //                 total: total, 
        //                 teacherUserName: teacherUserName,
        //                 time: time,
        //                 date: date, 
        //             });
    
        //             await booking.save()
        //     // SEND confirmation emails here etc.
        // } else if (eventType === 'payment_intent.payment_failed') {
        //     console.log('Payment failed X')
        // }
        


            // Verify if payment was successful
            // if (webhook.event === 'payment_intent.succeeded') {
            //     




module.exports = router;