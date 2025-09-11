require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

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

// MySQL Database Connection with Azure SSL Certificate
const dbConfig = {
  host: process.env.DB_HOST,        
  user: process.env.DB_USER + '@hrms-server', // ✅ FIXED: Azure requires username@servername format  
  password: process.env.DB_PASSWORD,   // ✅ FIXED: Changed from WORD to DB_PASSWORD
  database: process.env.DB_NAME,   
  port: 3306,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(__dirname, 'DigiCertGlobalRootCA.crt.pem')) // ✅ FIXED: Changed to .pem extension
  },
  connectTimeout: 60000,
  // Removed acquireTimeout as it's not valid for createPool
  flags: ['--ssl-mode=REQUIRED']
};

console.log('🔧 Database Config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  ssl: 'ENABLED with Azure Certificate'
});

const db = mysql.createPool(dbConfig);

// Test the connection with detailed error reporting
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    // Specific SSL error handling
    if (err.code === 'HANDSHAKE_SSL_ERROR' || err.message.includes('SSL')) {
      console.error('🔐 SSL ERROR: Make sure DigiCertGlobalRootCA.crt.pem file exists');
      console.error('💡 Download from: https://cacerts.digicert.com/DigiCertGlobalRootCA.crt.pem');
      
      // Check if certificate file exists
      const certPath = path.join(__dirname, 'DigiCertGlobalRootCA.crt.pem');
      if (!fs.existsSync(certPath)) {
        console.error('❌ Certificate file not found at:', certPath);
      } else {
        console.error('✅ Certificate file found, but SSL handshake failed');
      }
    }
    return;
  }
  console.log('✅ Connected to Azure MySQL database');
  connection.release();
});

// Health check endpoint
app.get('/health', (req, res) => {
  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ 
        status: 'ERROR', 
        message: 'Database connection failed',
        error: err.message 
      });
    }
    
    connection.ping((pingErr) => {
      connection.release();
      if (pingErr) {
        return res.status(500).json({ 
          status: 'ERROR', 
          message: 'Database ping failed',
          error: pingErr.message 
        });
      }
      res.json({ 
        status: 'OK', 
        message: 'Server and database are running',
        timestamp: new Date().toISOString()
      });
    });
  });
});

// API routes
const apiRoutes = require('./api')(db); 
app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server gracefully...');
  db.end((err) => {
    if (err) {
      console.error('Error closing database pool:', err);
    } else {
      console.log('✅ Database pool closed');
    }
    process.exit(0);
  });
});


















// const express = require('express');
// const app = express();
// const PORT = process.env.PORT || 8080;

// console.log('=== HRMS Backend Starting ===');
// console.log('Time:', new Date().toISOString());
// console.log('Port:', PORT);
// console.log('Node version:', process.version);

// app.get('/', (req, res) => {
//   console.log('Root endpoint accessed');
//   res.json({ 
//     status: 'OK', 
//     message: 'HRMS Backend is running!',
//     timestamp: new Date().toISOString()
//   });
// });

// app.get('/health', (req, res) => {
//   console.log('Health check accessed');
//   res.json({ status: 'healthy' });
// });

// app.listen(PORT, () => {
//   console.log(`Server started successfully on port ${PORT}`);
// });