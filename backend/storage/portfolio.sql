-- portfolio.sql

CREATE TABLE IF NOT EXISTS portfolio (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_symbol            TEXT    UNIQUE NOT NULL,
    total_shares            INTEGER NOT NULL,
    average_price_per_share REAL    NOT NULL
);
