-- portfolio.sql

CREATE TABLE IF NOT EXISTS portfolio (
    asset_type              TEXT    NOT NULL CHECK(asset_type IN ('CASH', 'STOCK')),
    stock_symbol            TEXT,
    number_of_shares        INTEGER,
    price_per_share         REAL,
    total_value             REAL    NOT NULL,
    available               REAL,
    PRIMARY KEY (asset_type, stock_symbol)
);
