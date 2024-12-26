-- transactions.sql

CREATE TABLE IF NOT EXISTS transactions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('BUY', 'SELL', 'DEPOSIT', 'WITHDRAW', 'DIVIDEND')),
    stock_symbol     TEXT,
    price_per_share  REAL,
    number_of_shares INTEGER,
    fee              REAL DEFAULT 0,
    amount           REAL NOT NULL,
    timestamp        DATETIME DEFAULT CURRENT_TIMESTAMP
);
