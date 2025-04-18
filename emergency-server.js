const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a simple HTML file if it doesn't exist
const publicDir = path.join(__dirname, 'public');
const indexPath = path.join(publicDir, 'index.html');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(indexPath)) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UPI Payment & Scam Detection</title>
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f5f7fb;
        color: #333;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        background-color: white;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        padding: 20px;
      }
      
      h1 {
        color: #5164BF;
        text-align: center;
        margin-bottom: 30px;
      }
      
      .feature-box {
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .feature-list {
        list-style-type: none;
        padding: 0;
      }
      
      .feature-item {
        margin: 10px 0;
        padding: 12px;
        background-color: #f0f4ff;
        border-radius: 6px;
        display: flex;
        align-items: center;
      }
      
      .check-icon {
        color: #5164BF;
        margin-right: 10px;
        font-weight: bold;
      }
      
      .button-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-top: 30px;
      }
      
      .action-button {
        background-color: #5164BF;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 16px;
        font-size: 16px;
        cursor: pointer;
        text-align: center;
        font-weight: bold;
      }
      
      .action-button:hover {
        background-color: #4257a5;
      }
      
      .subtitle {
        text-align: center;
        font-weight: bold;
        margin-bottom: 20px;
        font-size: 18px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>UPI Payment & Scam Detection</h1>
      
      <div class="feature-box">
        <div class="subtitle">Key Features</div>
        <ul class="feature-list">
          <li class="feature-item"><span class="check-icon">✓</span> UPI Scam Detection</li>
          <li class="feature-item"><span class="check-icon">✓</span> QR Code Security Scanner</li>
          <li class="feature-item"><span class="check-icon">✓</span> Voice Analysis for Scam Calls</li>
          <li class="feature-item"><span class="check-icon">✓</span> WhatsApp & Message Security</li>
        </ul>
      </div>
      
      <div class="button-grid">
        <button class="action-button">UPI Check</button>
        <button class="action-button">Scan QR</button>
        <button class="action-button">Voice Check</button>
        <button class="action-button">Message Check</button>
      </div>
    </div>
  </body>
</html>
  `;
  
  fs.writeFileSync(indexPath, htmlContent);
  console.log('Created emergency index.html file');
}

// Serve static files from the 'public' directory
app.use(express.static(publicDir));

// Fallback route to serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`Emergency server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});