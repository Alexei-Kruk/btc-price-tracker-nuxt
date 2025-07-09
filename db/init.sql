IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'btc_prices')
BEGIN
  CREATE TABLE btc_prices (
    id INT IDENTITY(1,1) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    price_usd DECIMAL(18,8) NOT NULL
  );
END
