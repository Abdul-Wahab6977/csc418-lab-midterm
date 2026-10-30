const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory array to store valid submissions
let submissions = [];

// Serve a simple HTML form for the portal
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Assignment Submission Portal</title></head>
        <body style="font-family: Arial; padding: 20px;">
            <h2>Assignment Submission Portal</h2>
            <form action="/submit" method="POST">
                <label>Name:</label><br>
                <input type="text" name="name" required><br><br>
                
                <label>Registration Number:</label><br>
                <input type="text" name="regNo" required><br><br>
                
                <label>Assignment Title:</label><br>
                <input type="text" name="title" required><br><br>
                
                <label>Submission URL:</label><br>
                <input type="url" name="url" required><br><br>
                
                <button type="submit">Submit Assignment</button>
            </form>
            <h3>Submitted List:</h3>
            <ul>
                ${submissions.map(s => `<li>${s.name} (${s.regNo}) - ${s.title} : <a href="${s.url}" target="_blank">${s.url}</a></li>`).join('')}
            </ul>
        </body>
        </html>
    `);
});

// Handle Form Submission with Validation
app.post('/submit', (req, res) => {
    const { name, regNo, title, url } = req.body;

    // Validation 1: Missing registration number or required fields
    if (!name || !regNo || !title || !url) {
        return res.status(400).json({ error: "All fields are required, including registration number." });
    }

    // Validation 2: Invalid submission URL format
    try {
        new URL(url);
    } catch (err) {
        return res.status(400).json({ error: "Invalid submission URL." });
    }

    // Save submission
    const newSubmission = { name, regNo, title, url };
    submissions.push(newSubmission);

    if (req.headers['content-type'] === 'application/json') {
        return res.status(200).json({ message: "Submission saved successfully", submissions });
    }

    res.redirect('/');
});

// Export app for testing purposes
module.exports = { app, submissions };

// Start server only if run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Portal running on port ${PORT}`));
}