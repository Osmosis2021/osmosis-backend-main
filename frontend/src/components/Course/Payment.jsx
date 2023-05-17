import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';

const backendURL = process.env.NODE_ENV === 'production' ? 'https://osmosis.herokuapp.com/' : 'http://localhost:8126/';

function Payment(props) {
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState('');

    // Fetch publishableKey from the server
    useEffect(() => {
        fetch(`${backendURL}stripe/config`).then(async (res) => {
            const { publishableKey } = await res.json();
            setStripePromise(loadStripe(publishableKey));
            console.log('At the end of useEffect for fetching the publishable key')
        }).catch((error) => {
            console.error('Error loading Stripe config:', error);
        });
    }, []);

    // Fetch client secret for the payment intent from the server
    useEffect(() => {
      fetch(`${backendURL}stripe/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: props.item.pricePerStudent,
          capacity: props.item.guests, 
        }),
      }).then(async (res) => {
          const { clientSecret } = await res.json();
          console.log('Received client secret:', clientSecret);
          setClientSecret(clientSecret);
        }).catch((error) => {
          console.error('Error creating payment intent:', error);
        });
    }, []);

    const options = {
        clientSecret: clientSecret
    }

  return (
    <>
      {stripePromise && clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm
            clientSecret={clientSecret}
            bookThisCourse={props.bookThisCourse}
          />
        </Elements>
      )}
    </>
  );
}

export default Payment;
  