const { z } = require('zod');

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('8126'),
    MONGOOSE_CONNECTION_STRING: z.string().min(1, "Database connection string is required"),
    ACCESS_TOKEN_SECRET: z.string().min(1, "Access token secret is required"),
    REFRESH_TOKEN_SECRET: z.string().min(1, "Refresh token secret is required"),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_LIVE_KEY: z.string().optional(),
    STRIPE_TEST_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_LIVE_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_TEST_KEY: z.string().optional(),
    EMAIL_HOST: z.string().optional(),
    EMAIL_PORT: z.string().transform(Number).optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASS: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().optional(),
});

const processEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGOOSE_CONNECTION_STRING: process.env.MONGOOSE_CONNECTION_STRING,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_LIVE_KEY: process.env.STRIPE_LIVE_KEY,
    STRIPE_TEST_KEY: process.env.STRIPE_TEST_KEY,
    STRIPE_PUBLISHABLE_LIVE_KEY: process.env.STRIPE_PUBLISHABLE_LIVE_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_PUBLISHABLE_TEST_KEY: process.env.STRIPE_PUBLISHABLE_TEST_KEY,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
};

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
}

module.exports = parsed.data;
