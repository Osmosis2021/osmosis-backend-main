const http = require('http');

describe('Smoke Tests', () => {
    // These tests require the server and client to be running.
    // We skip them by default in the CI/test environment.

    test.skip('Server Health Check', (done) => {
        const req = http.get('http://localhost:8126/', (res) => {
            expect([200, 302, 404]).toContain(res.statusCode);
            done();
        });
        req.on('error', (e) => {
            done.fail(`Server not reachable: ${e.message}`);
        });
    });

    test.skip('Client Health Check', (done) => {
        const req = http.get('http://localhost:3001/', (res) => {
            expect(res.statusCode).toBe(200);
            done();
        });
        req.on('error', (e) => {
            done.fail(`Client not reachable: ${e.message}`);
        });
    });
});
