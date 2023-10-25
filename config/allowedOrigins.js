const dotenv = require('dotenv')
dotenv.config()

const allowedOrigins = [
    'https://getosmosis.io'
];

if(process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000')
    allowedOrigins.push('http://localhost:8100')
    allowedOrigins.push('capacitor://localhost')
}

module.exports = allowedOrigins;