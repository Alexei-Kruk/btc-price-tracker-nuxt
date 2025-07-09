import axios from 'axios'
import { Client } from 'pg'
import { setTimeout } from 'timers/promises'

const COLLECTION_INTERVAL = 60000 // 1 minute in milliseconds
const BINANCE_API = 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'


async function fetchBtcPrice() {
  try {
    const response = await axios.get(BINANCE_API, { timeout: 10000 })
    const price = parseFloat(response.data.price)
    return isNaN(price) ? null : price
  } catch (error) {
    console.error('Binance API Error:', error.message)
    return null
  }
}

async function runCollector() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  await client.connect()
  console.log('Collector started. Interval:', COLLECTION_INTERVAL / 1000, 'seconds')

  while (true) {
    const startTime = Date.now()
    
    try {
      const price = await fetchBtcPrice()
      if (price !== null && typeof price === 'number' && price > 0) {
        await client.query(
          'INSERT INTO btc_prices (timestamp, price_usd) VALUES (NOW(), $1)',
          [price]
        )
        console.log(new Date().toISOString(), 'Saved BTC price:', price)
      } else {
        console.error(new Date().toISOString(), 'Skipped invalid BTC price:', price)
      }
    } catch (err) {
      console.error('Error:', err.message)
    }

    const elapsed = Date.now() - startTime
    const delay = Math.max(COLLECTION_INTERVAL - elapsed, 0)
    await setTimeout(delay)
  }
}

// Обработка ошибок
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
  process.exit(1)
})

runCollector().catch(console.error)