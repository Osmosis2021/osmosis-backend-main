import React, { useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button, Typography } from '@mui/material';
import './PaymentMethodForm.css';

const PaymentMethodForm = (props) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isCardComplete, setIsCardComplete] = useState(false);

  
  
	const handleSavePaymentMethod = async (event) => {

		event.preventDefault();
  
		if (!stripe || !elements) {
			// Stripe.js has not loaded yet. Make sure to disable
			// form submission until Stripe.js has loaded.
	  		return;
		}
  
		// const cardElement = elements.getElement(CardElement);
  
		const cardInformation = await stripe.createPaymentMethod({
			type: 'card',
			card: elements.getElement(CardElement)
		})
  
		if (cardInformation.error) {

			console.log(cardInformation.error.message);

		} else {
		
			// Payment method successfully created
	  		const paymentMethodID = cardInformation.paymentMethod.id
	  		console.log('paymentMethodID:', paymentMethodID);
  
	  		// Call parent, OrdersAndPayments onSavePaymentMethod function to save payment method
	  	
			props.onSavePaymentMethod(paymentMethodID);

		}
  	};


  	return (

    	<form id='payment-form' onSubmit={handleSavePaymentMethod}>
        	{/* <Typography variant="h6">Enter your payment method:</Typography> */}
        	
			<CardElement
            	onChange={(event) => setIsCardComplete(event.complete)}
        	/>

        	<Button style={{marginTop:'4%', color:'white'}} type='submit' variant='contained' disabled={!stripe || !isCardComplete}>
            	Save Payment Method
        	</Button>
    	</form>

  	);
};

export default PaymentMethodForm;
