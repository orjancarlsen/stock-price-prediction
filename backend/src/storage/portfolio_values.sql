CREATE TABLE IF NOT EXISTS portfolio_values (
    date DATE DEFAULT (DATE('now', 'localtime')),
    value REAL NOT NULL,
    PRIMARY KEY (date)
);