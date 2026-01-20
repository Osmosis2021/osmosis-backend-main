# Auth + Stripe Contract

This document outlines the integration between the Authentication service and Stripe.

## Registration Flow

When a user registers, the following Stripe entities are created based on their roles:

### 1. Student Role (`isStudent: true`)
- **Action**: Create a Stripe Customer.
- **Stripe API**: `stripe.customers.create`
- **Input**: `name` (firstName + lastName), `email`.
- **Output**: `customerStripeID` (stored in User model).

### 2. Teacher Role (`isTeacher: true`)
- **Action**: Create a Stripe Express Account.
- **Stripe API**: `stripe.accounts.create`
- **Input**: `type: 'express'`, `country: 'US'`, `email`, `business_type: 'individual'`, `business_profile.url`, `individual` (name, email), `capabilities.transfers.requested: true`.
- **Output**: `stripeID` (stored in User model).

### 3. Both Roles
- **Action**: Create both a Stripe Customer and a Stripe Express Account.

## Authentication Logic

### Login
- Supports login via `email` or `userName`.
- Uses `bcrypt` for password verification.
- Generates:
    - `accessToken`: Short-lived (1 day), contains `userName` and `roles`.
    - `refreshToken`: Long-lived (30 days, optional), stored in `jwt` cookie and User model.

### Refresh
- Uses `refreshToken` from `jwt` cookie to issue a new `accessToken`.

## Environment Variables Required

- `STRIPE_SECRET_LIVE_KEY`: Secret key for Stripe API calls.
- `STRIPE_PUBLISHABLE_LIVE_KEY`: Public key for frontend Stripe initialization.
- `ACCESS_TOKEN_SECRET`: Secret for signing Access Tokens.
- `REFRESH_TOKEN_SECRET`: Secret for signing Refresh Tokens.

## Failure Modes

- **Stripe API Down**: Registration will fail if Stripe creation fails.
- **Duplicate Email/Username**: Registration will fail with a message.
- **Invalid Credentials**: Login returns 401.
- **Expired/Invalid Token**: Protected routes return 401/403.
