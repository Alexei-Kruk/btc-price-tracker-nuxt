CREATE TABLE IF NOT EXISTS btc_prices (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  price_usd NUMERIC(18,8) NOT NULL
);