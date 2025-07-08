import axios from 'axios'
import cron from 'node-cron'
import pool from './db.js'

async function fetchBTCPrice() {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd',
      },
    });

    const price = res.data.bitcoin.usd;
    const timestamp = new Date();

    await pool.query(
      'INSERT INTO btc_prices (timestamp, price_usd) VALUES ($1, $2)',
      [timestamp, price]
    );

    console.log(`[${timestamp.toISOString()}] Inserted price: $${price}`);
  } catch (err) {
    console.error('Error fetching price:', err.message);
  }
}

// Каждый 1 минуту
cron.schedule('* * * * *', fetchBTCPrice);

// Первый запуск сразу
fetchBTCPrice();
