const request = require('supertest');
const app = require('./server');

beforeEach(() => {
  app.resetSubmissions();
});

describe('Assignment Submission Portal', () => {
  test('Complete details and valid URL: submission is saved and listed', async () => {
    const res = await request(app).post('/submit').send({
      name: 'Ali Khan',
      regNo: 'FA22-BCS-001',
      title: 'DevOps Assignment 1',
      url: 'https://github.com/ali/assignment1'
    });
    expect(res.statusCode).toBe(201);

    const list = await request(app).get('/submissions');
    expect(list.body.length).toBe(1);
    expect(list.body[0].regNo).toBe('FA22-BCS-001');
  });

  test('Missing registration number is rejected with validation message', async () => {
    const res = await request(app).post('/submit').send({
      name: 'Ali Khan',
      regNo: '',
      title: 'DevOps Assignment 1',
      url: 'https://github.com/ali/assignment1'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toContain('Registration number is required');
  });

  test('Invalid submission URL is rejected and not saved', async () => {
    const res = await request(app).post('/submit').send({
      name: 'Ali Khan',
      regNo: 'FA22-BCS-001',
      title: 'DevOps Assignment 1',
      url: 'not-a-valid-url'
    });
    expect(res.statusCode).toBe(400);

    const list = await request(app).get('/submissions');
    expect(list.body.length).toBe(0);
  });
});