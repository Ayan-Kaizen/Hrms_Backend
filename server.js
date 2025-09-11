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

// MySQL Database Connection with proper Azure SSL configuration
const dbConfig = {
  host: process.env.DB_HOST,        
  user: process.env.DB_USER,       
  password: process.env.DB_PASS,   
  database: process.env.DB_NAME,   
  port: 3306,
  ssl: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  },
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  // Azure MySQL requires this flag for SSL
  flags: ['--ssl-mode=REQUIRED']
};

console.log('🔧 Database Config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

const db = mysql.createPool(dbConfig);

// Enhanced connection test with better error handling
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    if (err.code === 'HANDSHAKE_SSL_ERROR') {
      console.error('🔐 SSL HANDSHAKE FAILED - Azure MySQL requires proper SSL configuration');
    }
    
    // Don't exit the process, just log the error
    // The app might still start and try to reconnect later
    return;
  }
  
  console.log('✅ Connected to Azure MySQL database');
  
  // Test a simple query
  connection.query('SELECT 1 + 1 AS solution', (error, results) => {
    if (error) {
      console.error('❌ Query test failed:', error.message);
    } else {
      console.log('✅ Database query test successful:', results[0].solution);
    }
    connection.release();
  });
});

// Enhanced health check endpoint with database status
app.get('/health', (req, res) => {
  db.getConnection((err, connection) => {
    if (err) {
      return res.status(503).json({ 
        status: 'ERROR', 
        message: 'Database connection failed',
        error: err.message 
      });
    }
    
    connection.query('SELECT 1 AS test', (error) => {
      connection.release();
      
      if (error) {
        return res.status(503).json({ 
          status: 'ERROR', 
          message: 'Database query failed',
          error: error.message 
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

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  db.end(() => {
    console.log('✅ Database pool closed');
    process.exit(0);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  // Don't exit the process for database errors
  if (!err.message.includes('MySQL')) {
    process.exit(1);
  }
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});