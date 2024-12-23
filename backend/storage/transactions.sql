-- transactions.sql

CREATE TABLE IF NOT EXISTS transactions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_symbol     TEXT NOT NULL,
    action           TEXT CHECK(action IN ('BUY', 'SELL')) NOT NULL,
    price_per_share  REAL NOT NULL,
    number_of_shares INTEGER NOT NULL,
    brokerage_fee    REAL DEFAULT 0,
    timestamp        DATETIME DEFAULT CURRENT_TIMESTAMP
);
