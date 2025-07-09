import { Pool } from 'pg'

interface QueryParams {
  from?: string
  to?: string
  range?: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as QueryParams
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })
  const client = await pool.connect()

  // Определяем период и нужную агрегацию
  let granularity = 'minute'
  let interval = '1 day'
  if (query.from && query.to) {
    // Если пользователь выбрал диапазон, определяем гранулярность по разнице дат
    const fromDate = new Date(query.from)
    const toDate = new Date(query.to)
    const diffMs = toDate.getTime() - fromDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    if (diffDays <= 2) granularity = 'minute'
    else if (diffDays <= 14) granularity = 'hour'
    else if (diffDays <= 90) granularity = 'day'
    else granularity = 'week'
  } else {
    // Preset periods
    const range = query.range || '1d'
    if (range === '1d') { granularity = 'minute'; interval = '1 day' }
    else if (range === '7d') { granularity = 'hour'; interval = '7 days' }
    else if (range === '1m') { granularity = 'day'; interval = '1 month' }
    else if (range === '1y') { granularity = 'week'; interval = '1 year' }
  }

  try {
    let sql: string
    let params: string[] = []

    if (query.from && query.to) {
      sql = `
        SELECT 
          date_trunc('${granularity}', timestamp) as ts,
          AVG(price_usd) as price_usd
        FROM btc_prices
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY ts
        ORDER BY ts ASC
      `
      params = [query.from, query.to]
    } else {
      sql = `
        SELECT 
          date_trunc('${granularity}', timestamp) as ts,
          AVG(price_usd) as price_usd
        FROM btc_prices
        WHERE timestamp >= NOW() - INTERVAL '${interval}'
        GROUP BY ts
        ORDER BY ts ASC
      `
    }

    type Row = { ts: Date, price_usd: number }
    const result = await client.query<Row>(sql, params)
    return result.rows.map(row => ({
      timestamp: row.ts,
      price: parseFloat(row.price_usd.toString())
    }))

  } catch (err) {
    console.error('Database error:', err)
    return createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch data'
    })
  } finally {
    client.release()
  }
})