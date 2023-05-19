// const STRIPE_API_KEY = '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';
const router = require('express').Router();
const Stripe = require('stripe');
const Booking = require('../models/booking');
const jwt = require('jsonwebtoken');
const jwtSecret = 'randomString';

const STRIPE_API_TEST_KEY =
	'sk_test_51MngVdIVE7cwgof9pqeXfJrrTzTiw1ZAKnfvDse1CkAvawprEjj5qvJyYKSFRCw8mqtaNfBNs1nXCPsDpmdctuBJ00tp7CqaqK';
const STRIPE_PUBLISHABLE_KEY =
	'pk_test_51MngVdIVE7cwgof9GzZJfeu7r3wQcv5vb42koFkURzk6VG6cdafDw9ZHDM5WvHxMbRFoJtlmBQnNnN8P8JNjcxJa00qdQ8gXta';
const CLIENT_URL = 'http://localhost:3000';
const stripe = Stripe(STRIPE_API_TEST_KEY);

router.get('/config', (req, res) => {
	res.send({ publishableKey: STRIPE_PUBLISHABLE_KEY });
});

router.post('/create-payment-intent', async (req, res) => {
	const { item, amount, capacity } = req.body;
	const { token } = req.cookies;

	// jwt.verify(token, jwtSecret, {}, async (err, userData) => {
	// 	if (err) throw err;

	try {
		const paymentIntent = await stripe.paymentIntents.create({
			amount: amount * capacity * 100,
			currency: 'usd',
			payment_method_types: ['card'],
		});
		res.send({ clientSecret: paymentIntent.client_secret });
	} catch (error) {
		return res.status(400).send({ error: { message: error.message } });
	}
});

module.exports = router;
