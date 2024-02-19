const allowedOrigins = [
    'https://getosmosis.io',
    'http://localhost',
    'capacitor://localhost'
];

if(process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000')
    allowedOrigins.push('http://172.16.1.1:8100')
    allowedOrigins.push('http://192.168.1.68:8100')
}

module.exports = allowedOrigins;