import { Pool } from 'pg'

interface QueryParams {
  from?: string
  to?: string
  range?: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as QueryParams & { all?: string, days?: string }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })
  const client = await pool.connect()

  // Если ?all=1 — возвращаем всю историю без агрегации
  if (query.all === '1') {
    try {
      const result = await client.query<{ ts: Date, price_usd: number }>(
        `SELECT (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow') as ts, price_usd FROM btc_prices ORDER BY ts ASC`
      )
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
  }

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

    // Если кастомный диапазон или days
    if (query.from && query.to) {
      sql = `
        SELECT 
          date_trunc('${granularity}', (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) as ts,
          AVG(price_usd) as price_usd
        FROM btc_prices
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY ts
        ORDER BY ts ASC
      `
      params = [query.from, query.to]
    } else if (query.days) {
      // days — вычисляем from/to на сервере
      if (query.days === '1') {
        // Для day: последние 24 часа, агрегация по 5 минутам
        sql = `
          SELECT 
            date_trunc('minute', (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) -
              INTERVAL '1 minute' * (EXTRACT(MINUTE FROM (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow'))::int % 5) as ts,
            AVG(price_usd) as price_usd
          FROM btc_prices
          WHERE (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow') >= (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow') - INTERVAL '24 hours'
            AND (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow') <= (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')
          GROUP BY ts
          ORDER BY ts ASC
        `
      } else {
        sql = `
          SELECT 
            date_trunc('${granularity}', (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) as ts,
            AVG(price_usd) as price_usd
          FROM btc_prices
          WHERE timestamp BETWEEN (
            (date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) - INTERVAL '${parseInt(query.days)-1} days') AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC'
          ) AND (
            (date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) + INTERVAL '1 day' - INTERVAL '1 second') AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC'
          )
          GROUP BY ts
          ORDER BY ts ASC
        `
      }
    } else {
      // Явно вычисляем from/to для каждого пресета (range)
      let fromExpr = '';
      let toExpr = '';
      if (interval === '1 day') {
        fromExpr = `((date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC'))`;
        toExpr = `((date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) + INTERVAL '1 day' - INTERVAL '1 second') AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC')`;
      } else if (interval === '7 days') {
        fromExpr = `((date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) - INTERVAL '6 days') AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC')`;
        toExpr = `((date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) + INTERVAL '1 day' - INTERVAL '1 second') AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC')`;
      } else if (interval === '1 month') {
        fromExpr = `((date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) - INTERVAL '29 days') AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC')`;
        toExpr = `((date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) + INTERVAL '1 day' - INTERVAL '1 second') AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC')`;
      } else if (interval === '1 year') {
        fromExpr = `((date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) - INTERVAL '364 days') AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC')`;
        toExpr = `((date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) + INTERVAL '1 day' - INTERVAL '1 second') AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC')`;
      } else {
        fromExpr = `((date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC'))`;
        toExpr = `((date_trunc('day', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) + INTERVAL '1 day' - INTERVAL '1 second') AT TIME ZONE 'Europe/Moscow' AT TIME ZONE 'UTC')`;
      }
      sql = `
        SELECT 
          date_trunc('${granularity}', (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')) as ts,
          AVG(price_usd) as price_usd
        FROM btc_prices
        WHERE timestamp BETWEEN ${fromExpr} AND ${toExpr}
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