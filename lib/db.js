import mysql from 'mysql2/promise'

let pool

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:               process.env.DB_HOST     || 'localhost',
      port:               parseInt(process.env.DB_PORT) || 3306,
      user:               process.env.DB_USER,
      password:           process.env.DB_PASSWORD,
      database:           process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit:    10,
      queueLimit:         0,
      charset:            'utf8mb4',
      decimalNumbers:     true,
      supportBigNumbers:  true,
      bigNumberStrings:   false,
      typeCast:           true,
    })
  }
  return pool
}

// MySQL 8.0.22+ rejects JS Number as DOUBLE for INT columns in prepared statements.
// Converting all numbers to strings fixes this — MySQL accepts string "123" for INT columns.
function toStrings(params) {
  if (!Array.isArray(params)) return params
  return params.map(v => (typeof v === 'number' ? String(v) : v))
}

export const db = {
  execute:       (sql, params) => getPool().execute(sql, toStrings(params)),
  query:         (sql, params) => getPool().query(sql, toStrings(params)),
  getConnection: ()            => getPool().getConnection(),
}