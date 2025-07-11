#!/bin/sh

# Проверяем, есть ли исторические данные за 2023 год
count=$(npx ts-node -e '
const { Client } = require("pg");
(async()=>{
  const c=new Client({connectionString:process.env.DATABASE_URL||"postgresql://postgres:postgres@db:5432/btc"});
  await c.connect();
  const r=await c.query("SELECT COUNT(*) FROM btc_prices WHERE timestamp < '2024-01-01'");
  console.log(r.rows[0].count);
  await c.end();
})()')

if [ "$count" -eq 0 ]; then
  echo "[entrypoint] Импортируем исторические данные..."
  npx ts-node import_btc_history.ts
else
  echo "[entrypoint] Исторические данные уже есть, импорт не требуется."
fi

npm start
