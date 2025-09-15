const mysql = require('mysql2/promise');
require('dotenv').config();
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
 ssl: {
   ca: fs.readFileSync(path.join(__dirname, "DigiCertGlobalRootG2.crt.pem")),
   rejectUnauthorized: true
 }
});

module.exports = {
  findByEmail: async (email) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows;
  },
};
