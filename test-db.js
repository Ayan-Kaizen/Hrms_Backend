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
  port: 8080,
 ssl: {
 // ca: fs.readFileSync(path.join(__dirname, 'BaltimoreCyberTrustRoot.pem'))
  rejectUnauthorized: false
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
