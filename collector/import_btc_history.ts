import axios from "axios"
import { Client } from "pg"

const PG_URL = process.env.PG_URL || "postgresql://postgres:postgres@localhost:5432/btc";
const BINANCE_API = "https://api.binance.com/api/v3/klines";

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}


type RawBinanceKline = [
  number, // openTime
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  number, // closeTime
  string, // quoteAssetVolume
  number, // numberOfTrades
  string, // takerBuyBaseAssetVolume
  string, // takerBuyQuoteAssetVolume
  string  // ignore
];

function parseKline(arr: RawBinanceKline): BinanceKline {
  return {
    openTime: arr[0],
    open: arr[1],
    high: arr[2],
    low: arr[3],
    close: arr[4],
    volume: arr[5],
    closeTime: arr[6],
    quoteAssetVolume: arr[7],
    numberOfTrades: arr[8],
    takerBuyBaseAssetVolume: arr[9],
    takerBuyQuoteAssetVolume: arr[10],
    ignore: arr[11],
  };
}

async function fetchBinanceKlines(symbol: string, interval: string, startTime: number, endTime: number): Promise<BinanceKline[]> {
  const res = await axios.get(BINANCE_API, {
    params: {
      symbol,
      interval,
      startTime,
      endTime,
      limit: 1000
    }
  });
  return (res.data as RawBinanceKline[]).map(parseKline);
}

async function main() {
  const from = new Date("2023-01-01").getTime();
  const to = Date.now();
  const symbol = "BTCUSDT";
  const interval = "1d";
  let klines: BinanceKline[] = [];
  let start = from;
  const oneDay = 24 * 60 * 60 * 1000;
  while (start < to) {
  const end = Math.min(start + oneDay * 1000, to); // 1000 дней максимум за раз
  const chunk = await fetchBinanceKlines(symbol, interval, start, end);
    if (chunk.length === 0) break;
    klines = klines.concat(chunk);
    if (chunk.length < 1000) break;
    start = chunk[chunk.length - 1].openTime + oneDay;
    await new Promise(r => setTimeout(r, 500)); // задержка для обхода лимитов
  }

  const prices: [number, number][] = klines.map(k => [k.openTime, parseFloat(k.close)]);

  const client = new Client({ connectionString: PG_URL });
  await client.connect();

  for (const [timestamp, price] of prices) {
    await client.query(
      "INSERT INTO btc_prices (timestamp, price_usd) VALUES (to_timestamp($1 / 1000.0), $2) ON CONFLICT DO NOTHING",
      [timestamp, price]
    );
  }

  await client.end();
  console.log("Импорт завершён!");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
