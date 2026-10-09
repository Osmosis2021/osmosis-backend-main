const stripe = require('./stripeClient');
const env = require('../config/env');

const httpError = (status, message) => Object.assign(new Error(message), { status });

const frontendUrl = () => (env.FRONTEND_URL || 'https://getstudiotime.com').replace(/\/$/, '');

// Stripe errors that mean "this account ID doesn't exist for our platform in the current mode"
// (e.g. it was created with test keys and we're now live, or creation never happened).
const isMissingAccountError = (err) =>
    err?.type === 'StripeInvalidRequestError'
    && (err.statusCode === 404 || ['resource_missing', 'account_invalid'].includes(err.code) || /No such account/i.test(err.message || ''));

const configError = (err) => {
    console.error('[payouts] Stripe rejected our API key. Check STRIPE_MODE and the matching STRIPE_*_KEY on the server.', err?.message);
    return httpError(503, "Payouts aren't available right now. Please try again later or contact Studio Time support.");
};

const createExpressAccount = (user) => stripe.accounts.create({
    type: 'express',
    country: 'US',
    email: user.email,
    business_type: 'individual',
    business_profile: {
        url: `https://getstudiotime.com/teachers/${user.userName}`,
        product_description: 'Hosts creative studio sessions booked through Studio Time.',
    },
    individual: {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
    },
    capabilities: {
        transfers: { requested: true },
    },
    metadata: { studioTimeUserId: String(user._id), userName: user.userName },
});

/**
 * Returns the host's Stripe Express account, creating one if they don't have a valid one yet
 * (signup may have skipped it, or the saved ID belongs to the other Stripe mode).
 */
const ensureConnectedAccount = async (user) => {
    if (!stripe.isConfigured) throw configError(new Error('Stripe key not set'));

    if (user.stripeID) {
        try {
            return await stripe.accounts.retrieve(user.stripeID);
        } catch (err) {
            if (err?.type === 'StripeAuthenticationError') throw configError(err);
            if (!isMissingAccountError(err)) throw err;
            console.warn(`[payouts] Saved Stripe account ${user.stripeID} for ${user.userName} isn't available in ${stripe.stripeMode} mode; creating a new one.`);
        }
    }

    try {
        const account = await createExpressAccount(user);
        user.stripeID = account.id;
        await user.save();
        return account;
    } catch (err) {
        if (err?.type === 'StripeAuthenticationError') throw configError(err);
        console.error('[payouts] Could not create Stripe account:', err?.message);
        throw httpError(502, "We couldn't start payout setup with Stripe. Please try again in a moment.");
    }
};

/** A fresh link to Stripe's hosted onboarding for the host. */
const createOnboardingLink = async (user) => {
    const account = await ensureConnectedAccount(user);
    const link = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${frontendUrl()}/payouts/refresh`,
        return_url: `${frontendUrl()}/payouts/return`,
        type: 'account_onboarding',
    });
    return link.url;
};

/** Saves Stripe's payouts_enabled on the user when it changed. */
const syncPayoutsFlag = async (user, account) => {
    const enabled = Boolean(account?.payouts_enabled);
    if (user.payoutsEnabled !== enabled) {
        user.payoutsEnabled = enabled;
        await user.save();
    }
    return enabled;
};

/**
 * Fills in payoutsEnabled for hosts we haven't checked with Stripe yet (e.g. hosts who
 * onboarded before the flag existed). Never throws; unknown hosts stay unknown.
 */
const refreshUnknownPayoutFlags = async (users) => {
    if (!stripe.isConfigured) return;
    const unknown = users.filter((u) => u?.stripeID && typeof u.payoutsEnabled !== 'boolean' && typeof u.save === 'function');
    await Promise.all(unknown.map(async (user) => {
        try {
            await syncPayoutsFlag(user, await stripe.accounts.retrieve(user.stripeID));
        } catch (err) {
            if (isMissingAccountError(err)) {
                user.payoutsEnabled = false;
                await user.save().catch(() => {});
            }
        }
    }));
};

/** Plain-language payout status for the host's own screens. */
const getPayoutStatus = async (user) => {
    if (!user.stripeID) return { state: 'not_started', payoutsEnabled: false, mode: stripe.stripeMode };
    try {
        const account = await stripe.accounts.retrieve(user.stripeID);
        const payoutsEnabled = await syncPayoutsFlag(user, account);
        const detailsSubmitted = Boolean(account.details_submitted);
        const due = account.requirements?.currently_due || [];
        // ready: can be paid out · in_progress: started but hasn't finished Stripe's form
        // action_needed: Stripe needs more info · pending_review: submitted, Stripe is verifying
        let state;
        if (payoutsEnabled) state = 'ready';
        else if (!detailsSubmitted) state = 'in_progress';
        else if (due.length) state = 'action_needed';
        else state = 'pending_review';
        return { state, payoutsEnabled, detailsSubmitted, requirementsDue: due.length, mode: stripe.stripeMode };
    } catch (err) {
        if (err?.type === 'StripeAuthenticationError') throw configError(err);
        if (isMissingAccountError(err)) return { state: 'not_started', payoutsEnabled: false, mode: stripe.stripeMode };
        throw err;
    }
};

/** One-time sign-in link to the host's Stripe Express Dashboard (payouts, bank details). */
const createDashboardLink = async (user) => {
    const status = await getPayoutStatus(user);
    if (!status.detailsSubmitted) throw httpError(409, 'Finish setting up payouts first.');
    const link = await stripe.accounts.createLoginLink(user.stripeID);
    return link.url;
};

module.exports = { ensureConnectedAccount, createOnboardingLink, getPayoutStatus, createDashboardLink, syncPayoutsFlag, refreshUnknownPayoutFlags };
