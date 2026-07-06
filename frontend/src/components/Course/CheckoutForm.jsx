import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Alert,
  Fade
} from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { PremiumButton } from "../../ui/PremiumButton";

export default function CheckoutForm({ clientSecret, bookThisCourse, onBookingSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      const response = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // No return_url needed for 'if_required'
        },
        redirect: 'if_required'
      });

      if (response.error) {
        setMessage(response.error.message);
        setIsProcessing(false);
      } else if (response.paymentIntent.status === "succeeded") {
        console.log("Payment succeeded, creating booking...");
        try {
          const bookingResponse = await bookThisCourse();
          // Check for valid response (either success flag or just a valid object)
          if (bookingResponse.status === 200 || bookingResponse.data?.success || bookingResponse.data?._id) {
            console.log("Booking created successfully");
            setIsSuccess(true);
            if (onBookingSuccess) {
              const bookingId = bookingResponse.data.booking?._id || bookingResponse.data.bookingID || bookingResponse.data._id;
              onBookingSuccess(bookingId);
            }
          } else {
            console.error("Booking creation failed response:", bookingResponse);
            setMessage("Payment processed, but booking creation had an issue. Please contact support.");
            // We do NOT stop processing here, we might want to show a contact link
            // But generally, if we got here, money is taken. 
            setIsProcessing(false);
          }
        } catch (bookingErr) {
          console.error("Booking API error:", bookingErr);
          setMessage("Payment processed, but booking confirmation failed. Please save your receipt.");
          setIsProcessing(false);
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setMessage("An unexpected error occurred during payment.");
      setIsProcessing(false);
    }
  }

  if (isSuccess) {
    return (
      <Fade in={true}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Payment Successful!</Typography>
          <Typography variant="body2" color="text.secondary">Your booking is being finalized...</Typography>
        </Box>
      </Fade>
    );
  }

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Box sx={{ minHeight: 240, width: '100%' }}>
          <PaymentElement options={{ layout: 'tabs' }} />
        </Box>

        {message && (
          <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ borderRadius: 2 }}>
            {message}
          </Alert>
        )}

        <PremiumButton
          type="submit"
          variant="contained"
          fullWidth
          disabled={isProcessing || !stripe || !elements}
          sx={{ py: 2, fontSize: '1.1rem' }}
        >
          {isProcessing ? (
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
              <CircularProgress size={20} color="inherit" />
              <span>Processing...</span>
            </Stack>
          ) : (
            "Confirm & Pay"
          )}
        </PremiumButton>

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
          Secure payment powered by Stripe
        </Typography>
      </Stack>
    </form>
  );
}