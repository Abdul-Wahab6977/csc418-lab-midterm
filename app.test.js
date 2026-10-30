const request = require('supertest');
const { app, submissions } = require('./server');

describe('Assignment Submission Portal Tests', () => {
    
    test('1. Complete details and a valid submission URL', async () => {
        const response = await request(app)
            .post('/submit')
            .send({
                name: "Abdul Wahab",
                regNo: "FA23-BSE-031",
                title: "DevOps Lab Midterm",
                url: "https://github.com/Abdul-Wahab6977/csc418-lab-midterm"
            })
            .set('Content-Type', 'application/json');
        
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Submission saved successfully");
    });

    test('2. Missing registration number', async () => {
        const response = await request(app)
            .post('/submit')
            .send({
                name: "Abdul Wahab",
                regNo: "", // Missing
                title: "DevOps Lab Midterm",
                url: "https://github.com/Abdul-Wahab6977/csc418-lab-midterm"
            })
            .set('Content-Type', 'application/json');
        
        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
    });

    test('3. Invalid submission URL', async () => {
        const response = await request(app)
            .post('/submit')
            .send({
                name: "Abdul Wahab",
                regNo: "FA23-BSE-031",
                title: "DevOps Lab Midterm",
                url: "not-a-valid-url" // Invalid URL format
            })
            .set('Content-Type', 'application/json');
        
        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
    });
});