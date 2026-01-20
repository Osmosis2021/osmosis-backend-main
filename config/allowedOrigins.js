/**
 * Centralized list of allowed origins for CORS.
 * Includes production domains and local development origins.
 * Local development origins are only added when NODE_ENV is not 'production'.
 */
const env = require('./env');

const allowedOrigins = [
    'https://getosmosis.io',
    'https://www.getosmosis.io',
    'http://localhost',
    'capacitor://localhost'
];

if (env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000');
    allowedOrigins.push('http://localhost:3001');
    allowedOrigins.push('http://127.0.0.1:3000');
    allowedOrigins.push('http://127.0.0.1:3001');
    allowedOrigins.push('http://172.16.1.1:8100');
    allowedOrigins.push('http://192.168.1.68:8100');
}

module.exports = allowedOrigins;