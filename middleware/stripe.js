// const STRIPE_API_KEY = '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';
const router = require('express').Router()
const Stripe = require('stripe');
const Course = require('../models/course');


const STRIPE_API_TEST_KEY = 'sk_test_51MngVdIVE7cwgof9pqeXfJrrTzTiw1ZAKnfvDse1CkAvawprEjj5qvJyYKSFRCw8mqtaNfBNs1nXCPsDpmdctuBJ00tp7CqaqK';
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51MngVdIVE7cwgof9GzZJfeu7r3wQcv5vb42koFkURzk6VG6cdafDw9ZHDM5WvHxMbRFoJtlmBQnNnN8P8JNjcxJa00qdQ8gXta';
const CLIENT_URL = 'http://localhost:3000';

const stripe = Stripe(STRIPE_API_TEST_KEY);

    


    router.get("/config", (req, res) => {
        res.send({
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        });
    });

    router.get('/secret', async (req, res) => {
      const intent = // ... Fetch or create the PaymentIntent
      res.json({client_secret: intent.client_secret});
    });


    

    // get DB INFORMATION

    // create a customer

    // create a product / price with DB INFO 

    // router.post('/create-checkout-session', async (req, res) => {

    //     const {amount} = req.body.amount;
    //     const amountToCharge = parseInt(amount * 100)
    
    //     const session = await stripe.checkout.sessions.create({
    //         line_items: [{
    //             price_data: {
    //                 unit_amount: amountToCharge,
    //                 currency: 'usd',
    //                 product_data: {
    //                     name: 'Will be title of course',
    //                     description: 'Thanks for joining my course',
    //                     images: []
    //                 }
    //             },
    //             quantity: 1,
    //             // product: 'kjlakjsfldj'
    //         }],
    //         success_url: 'http://localhost:3000/confirm',
    //         cancel_url: 'http://localhost:3000/MapOpen'
    //         // transfer_data: {destination: '{{CONNECTED_ACCOUNT_ID}}'},
    //       });
    
    //     res.send({url: session.url})
    // })


    router.post('/create-payment-intent', async(req, res) => {

        const {item} = req.body
        console.log('THIS IS THE ITEM:', item)

        try {
            const paymentIntent = await stripe.paymentIntents.create(
                {
                    amount: 90,
                    currency: 'usd',
                    payment_method_types: ['card'],
                        // application_fee_amount: 123,
                    },
                // {stripeAccount: '{{CONNECTED_ACCOUNT_ID}}'}
            );
            
            res.send({ clientSecret: paymentIntent.client_secret })

        } catch (error) {
            return res.status(400).send({
                error: {
                    message: error.message
                },
            });
        }
    })



module.exports = router;