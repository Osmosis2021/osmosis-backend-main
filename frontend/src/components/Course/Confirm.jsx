import { Container, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
// import Bubbles from './Bubbles/Bubbles';
import { useStripe } from "@stripe/react-stripe-js";

function Confirm() {
    const [message, setMessage] = useState("pending");
    const stripe = useStripe();

    useEffect(() => {
        
        if (!stripe) {
            return;
        }

        async function getStripeStuff() {
            // extract the 'payment_intent_client_secret'
            const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
            const teacherUserName = new URLSearchParams(window.location.search).get("teacherUserName");
            const date = new URLSearchParams(window.location.search).get("date");
            const time = new URLSearchParams(window.location.search).get("time");

            // get the client payment status information and payment id from STRIPE API
            let res = await stripe.retrievePaymentIntent(clientSecret);

            // all info JSON, payment amount, description,
            console.log("res:", res.paymentIntent);

            // payment id
            console.log("paymentId:", res.paymentIntent.id);

            // payment status
            console.log("paymentStatus", res.paymentIntent.status, res.paymentIntent);

            switch (res.paymentIntent.status) {
                case "succeeded":
                    console.log('in succeeded branch', res.paymentIntent);
                    setMessage(`Success! Payment received. You're all set to join ${teacherUserName}'s class on ${date} at ${time}.`);
                    break;

                case "processing":
                    console.log('in processing branch');

                    setMessage(
                        "Payment processing. We'll update you when payment is received."
                    );
                    break;

                case "requires_payment_method":
                    console.log('in requirespaymentmethod branch');
                    // Redirect your user back to your payment page to attempt collecting
                    // payment again
                    setMessage("Payment failed. Please try another payment method.");
                    break;

                default:
                    console.log('in default branch');
                    setMessage("Something went wrong.");
                    break;
            }
        }

        getStripeStuff();

    }, [stripe]);
            
        //   const { publishableKey } = fetch ('stripe/config').then(res => res.json())
        //   loadStripe(publishableKey);
        //   const {paymentIntent} = stripe.retrievePaymentIntent(getSecret) 
        //   console.log(paymentIntent)
        
  return (
    <>
        <Typography variant='h3' mb={4} mt={4} align='center'>Congratulations!</Typography>
        <Container sx={{ py: 2, }}>
            {/* <Bubbles/> */}
                
            <Typography variant="h4">
                {message}
            </Typography>
            <br/>
            <Typography variant="h5">
                Friday March 28th from 7:30AM - 9:00AM
            </Typography>

        </Container>
    </>
  )
}

export default Confirm;