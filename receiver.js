const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

app.post('/receive-report', (req, res) => {
    const reportData = req.body;
    
    // Save report as test-report.json locally
    fs.writeFileSync('test-report.json', JSON.stringify(reportData, null, 2));
    
    console.log("Test report received and saved to test-report.json successfully!");
    res.status(200).json({ status: "success", message: "Report saved locally." });
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Local receiver listening on port ${PORT}`);
});