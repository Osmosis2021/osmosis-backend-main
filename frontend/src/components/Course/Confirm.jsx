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

            // get the client payment status information and payment id from STRIPE API
            let res = await stripe.retrievePaymentIntent(clientSecret);

            // all info JSON, payment amount, description,
            console.log("res:", res.paymentIntent);

            // payment id
            console.log("paymentId:", res.paymentIntent.id);

            // payment status
            console.log("paymentStatus", res.paymentIntent.status);

            switch (res.paymentIntent.status) {
                case "succeeded":
                    setMessage("Success! Payment received.");
                    break;

                case "processing":
                    setMessage(
                        "Payment processing. We'll update you when payment is received."
                    );
                    break;

                case "requires_payment_method":
                    // Redirect your user back to your payment page to attempt collecting
                    // payment again
                    setMessage("Payment failed. Please try another payment method.");
                    break;

                default:
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
                You're all set to join xyz's class for {message}
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