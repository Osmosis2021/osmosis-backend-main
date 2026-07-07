const request = require('supertest');
const express = require('express');
const cors = require('cors');
const corsOptions = require('../config/corsOptions');
const credentials = require('../middleware/credentials');
const allowedOrigins = require('../config/allowedOrigins');

describe('CORS Configuration', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(credentials);
        app.use(cors(corsOptions));
        app.get('/test-cors', (req, res) => {
            res.json({ success: true });
        });
    });

    it('should allow requests from allowed origins (e.g., localhost:3000)', async () => {
        const origin = 'http://localhost:3000' || 'http://localhost:3001';
        const response = await request(app)
            .get('/test-cors')
            .set('Origin', origin);

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(origin);
        expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow requests from production origin', async () => {
        const origin = 'https://getstudiotime.com';
        const response = await request(app)
            .get('/test-cors')
            .set('Origin', origin);

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(origin);
        expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow requests from www production origin', async () => {
        const origin = 'https://www.getstudiotime.com';
        const response = await request(app)
            .get('/test-cors')
            .set('Origin', origin);

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(origin);
        expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow requests from 127.0.0.1:3000', async () => {
        const origin = 'http://127.0.0.1:3000';
        const response = await request(app)
            .get('/test-cors')
            .set('Origin', origin);

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(origin);
        expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should block requests from disallowed origins', async () => {
        const origin = 'http://malicious-site.com';
        const response = await request(app)
            .get('/test-cors')
            .set('Origin', origin);

        // The cors middleware with origin function throws an error which goes to express default error handler
        // Since we don't have an error handler in this test app, it returns 500
        expect(response.status).toBe(500);
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should handle OPTIONS preflight requests', async () => {
        const origin = 'http://localhost:3000' || 'http://localhost:3001'
        const response = await request(app)
            .options('/test-cors')
            .set('Origin', origin)
            .set('Access-Control-Request-Method', 'GET');

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(origin);
        expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
});
