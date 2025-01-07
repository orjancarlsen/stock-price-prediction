# src/storage/portfolio.py

import sqlite3
from typing import Optional, List, Tuple, Any


class Portfolio:
    """
    Class representing a row in the `portfolio` table.

    Because the primary key is (asset_type, stock_symbol), we store both
    in the instance and use them together for updates/deletes.
    """

    TABLE_NAME = "portfolio"

    def __init__(
        self,
        asset_type: str,
        stock_symbol: Optional[str],
        number_of_shares: Optional[int],
        price_per_share: Optional[float],
        total_value: float,
        available: Optional[float] = None,
    ):
        # The primary key is (asset_type, stock_symbol)
        self.asset_type = asset_type  # e.g. 'CASH' or 'STOCK'
        self.stock_symbol = stock_symbol  # can be None for 'CASH'
        self.number_of_shares = number_of_shares
        self.price_per_share = price_per_share
        self.total_value = total_value
        self.available = available

    @classmethod
    def from_db_row(cls, row: Tuple[Any, ...]) -> "Portfolio":
        """
        Convert a database row tuple into a Portfolio object.

        Row format from SELECT * might be:
        (asset_type, stock_symbol, number_of_shares, price_per_share, total_value, available)
        """
        return cls(
            asset_type=row[0],
            stock_symbol=row[1],
            number_of_shares=row[2],
            price_per_share=row[3],
            total_value=row[4],
            available=row[5],
        )

    @classmethod
    def get_by_key(
        cls, conn: sqlite3.Connection, asset_type: str, stock_symbol: Optional[str]
    ) -> Optional["Portfolio"]:
        """
        Retrieve a single Portfolio row by its primary key: (asset_type, stock_symbol).
        """
        query = f"""
        SELECT * FROM {cls.TABLE_NAME}
        WHERE asset_type = ? AND stock_symbol IS ?
        """
        # Because stock_symbol can be None, we use 'IS ?' instead of '= ?'
        # so that NULL matches NULL.
        row = conn.execute(query, (asset_type, stock_symbol)).fetchone()
        if not row:
            return None
        return cls.from_db_row(row)

    @classmethod
    def all(cls, conn: sqlite3.Connection) -> List["Portfolio"]:
        """
        Retrieve all rows from the `portfolio` table.
        """
        query = f"SELECT * FROM {cls.TABLE_NAME}"
        rows = conn.execute(query).fetchall()
        return [cls.from_db_row(r) for r in rows]

    def insert(self, conn: sqlite3.Connection) -> None:
        """
        Insert this Portfolio row into the database.
        """
        # Because the primary key is (asset_type, stock_symbol), there's no auto-increment ID.
        query = f"""
        INSERT INTO {self.TABLE_NAME} (
            asset_type, stock_symbol, number_of_shares, price_per_share, total_value, available
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """
        values = (
            self.asset_type,
            self.stock_symbol,
            self.number_of_shares,
            self.price_per_share,
            self.total_value,
            self.available,
        )
        conn.execute(query, values)

    def update(self, conn: sqlite3.Connection) -> None:
        """
        Update this Portfolio row in the DB matching (asset_type, stock_symbol).
        """
        query = f"""
        UPDATE {self.TABLE_NAME}
        SET
            number_of_shares = ?,
            price_per_share = ?,
            total_value = ?,
            available = ?
        WHERE asset_type = ? AND stock_symbol IS ?
        """
        values = (
            self.number_of_shares,
            self.price_per_share,
            self.total_value,
            self.available,
            self.asset_type,
            self.stock_symbol,
        )
        conn.execute(query, values)

    def save(self, conn: sqlite3.Connection) -> None:
        """
        Insert or update depending on whether this row already exists in the DB.
        """
        # Attempt to find an existing row
        existing = self.get_by_key(conn, self.asset_type, self.stock_symbol)
        if existing is None:
            self.insert(conn)
        else:
            self.update(conn)

    def delete(self, conn: sqlite3.Connection) -> None:
        """
        Delete this row from the DB by matching (asset_type, stock_symbol).
        """
        query = f"""
        DELETE FROM {self.TABLE_NAME}
        WHERE asset_type = ? AND stock_symbol IS ?
        """
        conn.execute(query, (self.asset_type, self.stock_symbol))

    def __repr__(self) -> str:
        return (
            f"Portfolio(asset_type={self.asset_type}, "
            f"stock_symbol={self.stock_symbol}, "
            f"shares={self.number_of_shares}, "
            f"price={self.price_per_share}, "
            f"total_value={self.total_value}, "
            f"available={self.available})"
        )
