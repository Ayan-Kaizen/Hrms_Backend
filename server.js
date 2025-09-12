// require('dotenv').config();

// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const mysql = require('mysql2');
// const path = require('path');
// const fs = require('fs');

// const app = express();
// const PORT = process.env.APP_PORT || 8080;

// // Debug environment variables
// console.log('Environment Variables Check:');
// console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
// console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
// console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
// console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');
// console.log('PORT:', process.env.PORT || 'NOT SET');

// // Middleware setup
// app.use(cors());
// app.use(bodyParser.json());

// // Ensure 'uploads' folder exists
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
//   console.log('✅ uploads/ folder created');
// }

// // Serve static files
// app.use('/uploads', express.static(uploadDir));

// // MySQL Database Connection with Azure SSL Certificate
// const dbConfig = {
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: 3306,
// ssl: fs.readFileSync(path.join(__dirname, 'BaltimoreCyberTrustRoot.crt.pem')),
//   connectionLimit: 10
// };




// console.log('🔧 Database Config:', {
//   host: dbConfig.host,
//   user: dbConfig.user,
//   database: dbConfig.database,
//   port: dbConfig.port,
//   ssl: 'ENABLED with Azure Certificate'
// });

// const db = mysql.createPool(dbConfig);

// // Test the connection
// db.getConnection((err, connection) => {
//   if (err) {
//     console.error('❌ Database connection failed:');
//     console.error('Error code:', err.code);
//     console.error('Error message:', err.message);

//     if (err.code === 'HANDSHAKE_SSL_ERROR' || (err.message && err.message.includes('SSL'))) {
//       console.error('🔐 SSL ERROR: Check DigiCertGlobalRootCA.crt.pem and DB credentials.');
//     }
//     return;
//   }
//   console.log('✅ Connected to Azure MySQL database');
//   connection.release();
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Server is running' });
// });

// // API routes
// const apiRoutes = require('./api')(db);
// app.use('/api', apiRoutes);

// // Start the server
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });



















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

require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

console.log("🔍 Checking DB connection...");


const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
 ssl: {
  ca: fs.readFileSync(path.join(__dirname, 'DigiCertGlobalRootG2.crt.pem'))
}

};


console.log("🔧 Using config:", {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  ssl: "ENABLED"
});

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("❌ DB Connection FAILED");
    console.error("Code:", err.code);
    console.error("Message:", err.message);
    process.exit(1);
  } else {
    console.log("✅ SUCCESS: Connected to Azure MySQL");
    db.query("SELECT NOW() AS currentTime", (qErr, results) => {
      if (qErr) {
        console.error("❌ Query failed:", qErr.message);
      } else {
        console.log("⏰ DB Time:", results[0].currentTime);
      }
      db.end();
    });
  }
});
