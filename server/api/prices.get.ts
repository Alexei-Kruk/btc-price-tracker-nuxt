import { Pool } from 'pg'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const range = typeof query.range === 'string' ? query.range : '1d'

  const ranges: Record<string, string> = {
    '1d': "NOW() - INTERVAL '1 day'",
    '7d': "NOW() - INTERVAL '7 day'",
    '1m': "NOW() - INTERVAL '1 month'",
    '1y': "NOW() - INTERVAL '1 year'"
  }

  const from = ranges[range] || ranges['1d']

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })

  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `SELECT * FROM prices WHERE timestamp >= ${from} ORDER BY timestamp ASC`
    )
    return rows
  } finally {
    client.release()
  }
})
