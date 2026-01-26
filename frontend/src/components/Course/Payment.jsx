import React, { useEffect, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import useStore from "../../store";

// Singleton to hold the Stripe promise to prevent unnecessary re-initialization
let stripePromiseCache = null;

const getStripe = (backendURL) => {
    if (!stripePromiseCache) {
        stripePromiseCache = fetch(`${backendURL}stripe/config`)
            .then(res => res.json())
            .then(data => {
                if (!data?.publishableKey) throw new Error("Missing publishableKey");
                return loadStripe(data.publishableKey);
            });
    }
    return stripePromiseCache;
};

export default function Payment(props) {
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState("");

    const { backendURL, customerStripeID, paymentMethodID, email } = useStore();

    // Build request body safely (and consistently)
    const amountInCents = Math.round(Number(props?.item?.pricePerStudent || 0) * 100);

    const requestBody = useMemo(() => {
        const body = {
            amount: amountInCents,
            capacity: props?.item?.guests,
            metadata: props?.paymentMetadata,
            stripeID: props?.stripeID,
            email,
        };

        if (paymentMethodID) body.paymentMethodID = paymentMethodID;
        if (customerStripeID) body.customerStripeID = customerStripeID;

        return body;
    }, [amountInCents, props?.item?.guests, props?.paymentMetadata, props?.stripeID, email, paymentMethodID, customerStripeID]);

    useEffect(() => {
        let isMounted = true;

        async function init() {
            try {
                // Validation: Host must have Stripe ID
                if (!props?.stripeID) {
                    console.error("Missing Host Stripe ID - Cannot process payment");
                    return;
                }

                // 1) Initialize/Get global Stripe promise
                const stripe = await getStripe(backendURL);
                if (isMounted) setStripePromise(stripe);

                // 2) Create payment intent
                const intentRes = await fetch(`${backendURL}stripe/create-payment-intent`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                });

                const intentData = await intentRes.json();
                if (!intentData?.clientSecret) throw new Error("Missing clientSecret from /stripe/create-payment-intent");

                if (isMounted) setClientSecret(intentData.clientSecret);
            } catch (err) {
                console.error("Error initializing Stripe payment:", err);
            }
        }

        init();

        return () => {
            isMounted = false;
        };
    }, [backendURL, props?.stripeID, requestBody]);

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

    if (!stripePromise || !clientSecret || !elementsOptions) return null;

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
