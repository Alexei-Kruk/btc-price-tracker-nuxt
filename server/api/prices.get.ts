import { Pool } from 'pg'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })

  const client = await pool.connect()

  try {
    let result

    // 1. Обработка кастомного диапазона: ?from=...&to=...
    if (query.from && query.to) {
      const from = query.from.toString()
      const to = query.to.toString()

      result = await client.query(
        `SELECT * FROM prices WHERE timestamp BETWEEN $1 AND $2 ORDER BY timestamp ASC`,
        [from, to]
      )
    } else {
      // 2. Обработка фиксированных диапазонов: ?range=1d|7d|1m|1y
      const range = typeof query.range === 'string' ? query.range : '1d'

      const ranges: Record<string, string> = {
        '1d': "NOW() - INTERVAL '1 day'",
        '7d': "NOW() - INTERVAL '7 day'",
        '1m': "NOW() - INTERVAL '1 month'",
        '1y': "NOW() - INTERVAL '1 year'"
      }

      const fromExpr = ranges[range] || ranges['1d']

      result = await client.query(
        `SELECT * FROM prices WHERE timestamp >= ${fromExpr} ORDER BY timestamp ASC`
      )
    }

    return result.rows
  } catch (err) {
    console.error('Ошибка при получении данных из базы:', err)
    return createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении данных из базы'
    })
  } finally {
    client.release()
  }
})
