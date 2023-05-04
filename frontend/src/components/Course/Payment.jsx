import React, {useEffect, useState} from 'react';
import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';

const backendURL = 'http://localhost:8126/';
// const stripePromise = loadStripe('pk_test_51MngVdIVE7cwgof9GzZJfeu7r3wQcv5vb42koFkURzk6VG6cdafDw9ZHDM5WvHxMbRFoJtlmBQnNnN8P8JNjcxJa00qdQ8gXta')

function Payment (props) {
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        fetch(`${backendURL}stripe/config`).then(async(res) => {
            const {publishableKey} = await res.json();
            setStripePromise(loadStripe(publishableKey));
        })
    }, [])

    useEffect(() => {
        fetch(`${backendURL}stripe/create-payment-intent`, {
            method:'POST', headers:{'Content-Type': 'application/json'},
            body: JSON.stringify({
                amount: props.item.pricePerStudent,
                capacity: props.item.guests
            }),
        }).then(async(res) => {
            const {clientSecret} = await res.json();
            setClientSecret(clientSecret);
        })
    }, [])

    
    
    return (
        <>
            {/* <h1>Payment Information</h1> */}
            {
                stripePromise && clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm bookThisCourse={props.bookThisCourse}/>
                    </Elements>
                )
            }
        </>
    )
}

export default Payment;