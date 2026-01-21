# Stripe Webhook Verification

To verify the Stripe webhook locally:

1.  **Install Stripe CLI:**
    Follow instructions at https://stripe.com/docs/stripe-cli

2.  **Login:**
    ```bash
    stripe login
    ```

3.  **Forward Events:**
    Forward events to your local server.
    ```bash
    stripe listen --forward-to localhost:8126/stripe/webhook
    ```
    *Copy the webhook signing secret (whsec_...) output by this command.*

4.  **Update Env:**
    Add or update `STRIPE_WEBHOOK_SECRET` in your `.env` file with the secret from step 3. Restart the server.

5.  **Trigger Event:**
    In a new terminal:
    ```bash
    stripe trigger payment_intent.succeeded
    ```

6.  **Verify:**
    - Check server logs for "Payment completed successfully".
    - Check CLI output for `200 OK`.

## Negative Test (Invalid Signature)
To verify signature checking works:
- Send a POST request to `/stripe/webhook` with a random body and no signature header (or invalid one).
- Expect `400 Bad Request`.
