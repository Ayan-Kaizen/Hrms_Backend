require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.APP_PORT || 8080;

// Debug environment variables
console.log("=== Environment Variables Check ===");
console.log("DB_HOST:", process.env.DB_HOST || "NOT SET");
console.log("DB_USER:", process.env.DB_USER || "NOT SET");
console.log("DB_NAME:", process.env.DB_NAME || "NOT SET");
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "SET" : "NOT SET");
console.log("APP_PORT:", PORT);

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Ensure 'uploads' folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("✅ uploads/ folder created");
}
app.use("/uploads", express.static(uploadDir));

// Detect environment
const isProd = process.env.NODE_ENV === "production";

// Load SSL certificate for MySQL
const certPath = path.join(__dirname, "DigiCertGlobalRootCA.crt.pem");

if (!fs.existsSync(certPath)) {
  console.error("❌ SSL certificate file not found at:", certPath);
  process.exit(1);
} else {
  console.log("✅ SSL certificate loaded from:", certPath);
}

// MySQL connection config
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,          
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
ssl: {
  ca: fs.readFileSync(path.join(__dirname, "DigiCertGlobalRootG2.crt.pem")),
  rejectUnauthorized: true
}
};

console.log("🔧 Database Config:", {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  sslMode: "CA CERT (TLS 1.3 enforced)",
});

// Create MySQL pool
const db = mysql.createPool(dbConfig);

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:");
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    process.exit(1); // Exit if DB connection fails
  }

  // Check TLS version (optional debug)
  const tlsSocket = connection.stream;
  if (tlsSocket && typeof tlsSocket.getProtocol === 'function') {
    console.log("🔐 TLS Protocol in use:", tlsSocket.getProtocol()); // Expected: TLSv1.3
  }

  console.log("✅ Connected to Azure MySQL database");
  connection.release();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// app.use(cors({
//   origin: [
//     'http://localhost:4200', // Local development
//     'https://yellow-mud-06dd68100.1.azurestaticapps.net/', // Replace with your actual URL
//     'https://*.azurestaticapps.net' // Wildcard for preview deployments
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
//   optionsSuccessStatus: 200
// }));

// API routes
const apiRoutes = require("./api")(db);
app.use("/api", apiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
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
