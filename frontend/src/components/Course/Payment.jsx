import React, { useEffect, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Alert, Button, Skeleton, Stack } from "@mui/material";
import CheckoutForm from "./CheckoutForm";
import useStore from "../../store";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

// Singleton to hold the Stripe promise to prevent unnecessary re-initialization
let stripePromiseCache = null;

const getStripe = (backendURL) => {
    if (!stripePromiseCache) {
        stripePromiseCache = fetch(`${backendURL}stripe/config`)
            .then(res => res.json())
            .then(data => {
                if (!data?.publishableKey) throw new Error("Missing publishableKey");
                return loadStripe(data.publishableKey);
            })
            .catch((err) => {
                // Don't cache a failure; the next attempt should try again.
                stripePromiseCache = null;
                throw err;
            });
    }
    return stripePromiseCache;
};

export default function Payment(props) {
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState("");
    const [loadError, setLoadError] = useState("");
    const [attempt, setAttempt] = useState(0);

    const { backendURL, paymentMethodID } = useStore();
    const axiosPrivate = useAxiosPrivate();

    // The server looks up the price, the host's payout account and the guest's Stripe customer
    // itself; we only say what is being booked. Built from primitives so a new PaymentIntent is
    // only created when the booking actually changes.
    const courseID = props?.item?.courseID;
    const timeslotID = props?.item?.selectedTimeslotID;
    const guests = props?.item?.guests;
    const requestBody = useMemo(() => ({ courseID, timeslotID, guests }), [courseID, timeslotID, guests]);

    useEffect(() => {
        let isMounted = true;

        async function init() {
            setLoadError("");
            setClientSecret("");
            try {
                // Validation: Host must have Stripe ID
                if (!props?.stripeID) {
                    setLoadError("This artist hasn't finished setting up payments yet, so this session can't be booked online.");
                    return;
                }

                // 1) Initialize/Get global Stripe promise
                const stripe = await getStripe(backendURL);
                if (isMounted) setStripePromise(stripe);

                // 2) Create payment intent
                const { data: intentData } = await axiosPrivate.post(`stripe/create-payment-intent`, requestBody);
                if (!intentData?.clientSecret) throw new Error("Missing clientSecret from /stripe/create-payment-intent");

                if (isMounted) setClientSecret(intentData.clientSecret);
            } catch (err) {
                console.error("Error initializing Stripe payment:", err);
                if (isMounted) {
                    setLoadError(err.response?.data?.error || err.response?.data?.message
                        || "We couldn't load the payment form. Check your connection and try again.");
                }
            }
        }

        init();

        return () => {
            isMounted = false;
        };
    }, [backendURL, props?.stripeID, requestBody, axiosPrivate, attempt]);

    // ✅ Styling for PaymentElement lives HERE:
    const elementsOptions = useMemo(() => {
        if (!clientSecret) return null;

        return {
            clientSecret,
            appearance: {
                theme: "stripe",
                variables: {
                    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
                    fontSizeBase: "16px",
                    colorText: "#111111",
                    colorPrimary: "#111111",     // black & white vibe
                    colorBackground: "#ffffff",
                    colorDanger: "#d32f2f",
                    borderRadius: "12px",
                    spacingUnit: "4px",
                },
                rules: {
                    ".Label": {
                        fontWeight: "700",
                        color: "#111111",
                    },
                    ".Input": {
                        border: "1px solid #E0E0E0",
                        boxShadow: "none",
                        padding: "12px 12px",
                    },
                    ".Input:focus": {
                        border: "1px solid #111111",
                        boxShadow: "0 0 0 3px rgba(0,0,0,0.08)",
                    },
                    ".Error": {
                        fontSize: "12px",
                    },
                    ".Block": {
                        backgroundColor: "#ffffff",
                    },
                },
            },
        };
    }, [clientSecret]);

    if (loadError) {
        return (
            <Alert
                severity="error"
                role="alert"
                sx={{ borderRadius: 2 }}
                action={props?.stripeID ? <Button color="inherit" size="small" onClick={() => setAttempt((n) => n + 1)}>Try again</Button> : undefined}
            >
                {loadError}
            </Alert>
        );
    }

    if (!stripePromise || !clientSecret || !elementsOptions) {
        return (
            <Stack spacing={2} aria-busy="true" aria-label="Loading secure payment form">
                <Skeleton variant="rounded" height={52} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rounded" height={52} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rounded" height={52} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rounded" height={56} sx={{ borderRadius: 3 }} />
            </Stack>
        );
    }

    return (
        <Elements stripe={stripePromise} options={elementsOptions}>
            <CheckoutForm
                clientSecret={clientSecret}
                bookThisCourse={props.bookThisCourse}
                paymentMetadata={props.paymentMetadata}
                paymentMethodID={paymentMethodID}
                onBookingSuccess={props.onBookingSuccess}
            />
        </Elements>
    );
}
