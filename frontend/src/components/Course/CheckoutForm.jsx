import { PaymentElement } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import useStore from "../../store";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';


export default function CheckoutForm(props) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const {userName} = useStore;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }
    setIsProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/students/${userName}`,
      },
    });
    setIsProcessing(false);
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
      return
    } 
    props.bookThisCourse()
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <button style={{display: 'flex', flexDirection: 'column', margin: 'auto', justifyContent: 'center', alignItems: 'center',
        background: 'transparent', border: 'none'}} disabled={isProcessing || !stripe || !elements} id="submit">
        <CheckCircleIcon style={{fontSize:'105px', color:'#00aeef'}}/>
        <span id="button-text">
          {isProcessing ? "Processing ... " : "Pay now"}
        </span>
      </button>
      {/* Show any error or success messages */}
      {message && <div style={{color: 'red', fontSize: '20px'}} id="payment-message">{message}</div>}
    </form>
  );
}