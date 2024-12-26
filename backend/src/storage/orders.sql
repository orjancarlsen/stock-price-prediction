-- orders.sql

CREATE TABLE IF NOT EXISTS orders (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    order_type        TEXT NOT NULL CHECK(order_type IN ('BUY', 'SELL')),
    stock_symbol      TEXT NOT NULL,
    price_per_share   REAL NOT NULL,
    number_of_shares  INTEGER NOT NULL,
    fee               REAL DEFAULT 0 NOT NULL,
    amount            REAL NOT NULL,
    status            TEXT NOT NULL CHECK(status IN ('PENDING', 'EXECUTED', 'CANCELED')),
    timestamp_created DATETIME DEFAULT (DATETIME('now', '+1 hour')), -- Adjusted for Europe/Oslo
    timestamp_updated DATETIME
);
