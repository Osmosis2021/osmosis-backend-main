import { useStripe, useElements, PaymentElement, CardElement } from "@stripe/react-stripe-js";
import { useState } from "react";
import useStore from "../../store";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";


export default function CheckoutForm(props) {
  const stripe = useStripe();
  const elements = useElements();
  const clientSecret = props.clientSecret
  const paymentMethodID = props.paymentMethodID
  console.log('CheckoutForm props =>', props)
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardInfo, setCardInfo] = useState()
  const {userName, isTeacher, customerStripeID, backendURL} = useStore();
  const navigate = useNavigate();
  // const elements = stripe.elements({ clientSecret: props.clientSecret})
  // const paymentElement = elements.create('payment')
  // paymentElement.mount('#payment-element')

    useEffect(() => {
        fetch(`${backendURL}stripe/retrieveStripeCustomerAccount/${customerStripeID}`).then(async (res) => {
            const stripeCustomerData = await res.json();
            setCardInfo(stripeCustomerData.card)
            console.log('stripeCustomerData', stripeCustomerData)
        })

    }, [])

  
  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsProcessing(true);

    const response = await stripe.confirmPayment({
     elements,
     confirmParams: {
      },
     redirect: 'if_required'
    });

    // const {teacherUserName, date, time} = props.paymentMetadata
    // const paymentMetadataString = new URLSearchParams({teacherUserName, date, time, bookingID: bookingResponse.data._id}).toString()
    
    if (response.error) {
      setMessage(response.error.message);
    } else {
      setMessage(`Payment Succeeded: ${response.paymentIntent.id}`);
      const bookingResponse = await props.bookThisCourse()
      console.log('bookThisCourse function RAN', bookingResponse)
      navigate(`/${isTeacher ? 'teachers' : 'students'}/${userName}`)
    }
    setIsProcessing(false);

    // const elements = stripe.elements({props.clientSecret})
    // const {teacherUserName, date, time} = props.paymentMetadata
    // const bookingResponse = await props.bookThisCourse()
    // console.log('bookThisCourse function RAN', bookingResponse)
    // const paymentMetadataString = new URLSearchParams({teacherUserName, date, time, bookingID: bookingResponse.data._id}).toString()
  //   const { error, paymentIntent } = await stripe.confirmPayment({
  //     elements,
  //     confirmParams: {
  //       return_url: `${window.location.origin}/confirm/?${paymentMetadataString}`,
  //     },
  //     redirect: 'if_required'
  //   });
    
  //   setIsProcessing(false);
    
  //   if (error.type === "card_error" || error.type === "validation_error") {
  //     setMessage(error.message);
  //     return
  //   } 
  
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement />
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