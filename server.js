require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Ensure 'uploads' folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('✅ uploads/ folder created');
}

// Serve static files
app.use('/uploads', express.static(uploadDir));

// MySQL Database Connection (Fixed)
const db = mysql.createPool({
  host: process.env.DB_HOST,        
  user: process.env.DB_USER,       
  password: process.env.DB_PASS,   
  database: process.env.DB_NAME,   
  port: 3306,
  ssl: {
    rejectUnauthorized: false  // Important for Azure
  },
  connectionLimit: 10,
  connectTimeout: 60000,
  acquireTimeout: 60000
});

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('📝 Check your .env file and Azure database settings');
    return;
  }
  console.log('✅ Connected to Azure MySQL database');
  connection.release();
});

// API routes
const apiRoutes = require('./api')(db); 
app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});