import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import useStore from '../../store';


function Payment(props) {
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState('');
    const { backendURL, customerStripeID, paymentMethodID, email } = useStore()
    console.log('paymentMethodID', paymentMethodID)

    console.log('customerStripeID', customerStripeID)
    // Fetch publishableKey from the server
    useEffect(() => {
        // Validation: Host must have a Stripe ID
        if (!props.stripeID) {
            console.error("Missing Host Stripe ID - Cannot process payment");
            return; // Stop early
        }

        // Convert Price to Cents (Stripe Requirement)
        const amountInCents = Math.round(Number(props.item.pricePerStudent) * 100);

        const requestBody = {
            amount: amountInCents,
            capacity: props.item.guests,
            metadata: props.paymentMetadata,
            stripeID: props.stripeID,
            email: email
        };

        if (paymentMethodID) {
            requestBody.paymentMethodID = paymentMethodID;
        }
        if (customerStripeID) {
            requestBody.customerStripeID = customerStripeID;
        }

        console.log("Initializing Payment Intent for:", amountInCents, "cents");


        fetch(`${backendURL}stripe/config`).then(async (res) => {
            const { publishableKey } = await res.json();
            setStripePromise(loadStripe(publishableKey));
            // Fetch client secret for the payment intent from the server
        }).then(() => {
            fetch(`${backendURL}stripe/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            }).then(async (res) => {
                const { clientSecret } = await res.json();
                setClientSecret(clientSecret);
            })
        }).catch((error) => {
            console.error('Error creating payment intent:', error);
        }).catch((error) => {
            console.log('hit this error', error)
        })
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
                        paymentMetadata={props.paymentMetadata}
                        paymentMethodID={paymentMethodID}
                        onBookingSuccess={props.onBookingSuccess}
                    />
                </Elements>
            )}
        </>
    );
}


export default Payment;
