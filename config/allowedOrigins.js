const dotenv = require('dotenv')
dotenv.config()

const allowedOrigins = [
    'https://getosmosis.io',
    'http://localhost:8126'
];

if(process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000')
}

module.exports = allowedOrigins;