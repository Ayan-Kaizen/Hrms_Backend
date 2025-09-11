require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080; // Changed to 8080 for Azure

// Debug environment variables
console.log('🔍 Environment Variables Check:');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET'); 
console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');

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

// MySQL Database Connection
const dbConfig = {
  host: process.env.DB_HOST,        
  user: process.env.DB_USER,       
  password: process.env.DB_PASS,   
  database: process.env.DB_NAME,   
  port: 3306,
  ssl: {
    rejectUnauthorized: false
  },
  connectionLimit: 10,
  connectTimeout: 60000,
  acquireTimeout: 60000
};

console.log('🔧 Database Config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

const db = mysql.createPool(dbConfig);

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('📝 Check your Azure environment variables');
    return;
  }
  console.log('✅ Connected to Azure MySQL database');
  connection.release();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API routes
const apiRoutes = require('./api')(db); 
app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});