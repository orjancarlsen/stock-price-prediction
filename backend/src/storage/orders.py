"""Model class for the `orders` table."""

import sqlite3
from datetime import datetime
from typing import Optional, List, Tuple, Any


class Order:
    """
    Class representing a row in the `orders` table.

    Provides convenience methods for creating the table, inserting,
    updating, and retrieving order records.
    """

    TABLE_NAME = "orders"

    def __init__(
        self,
        order_type: str,
        stock_symbol: str,
        price_per_share: float,
        number_of_shares: int,
        fee: float = 0.0,
        amount: float = 0.0,
        status: str = "PENDING",
        timestamp_created: Optional[datetime] = None,
        timestamp_updated: Optional[datetime] = None,
        id_: Optional[int] = None,
    ):
        self.id = id_
        self.order_type = order_type
        self.stock_symbol = stock_symbol
        self.price_per_share = price_per_share
        self.number_of_shares = number_of_shares
        self.fee = fee
        self.amount = amount
        self.status = status
        self.timestamp_created = timestamp_created
        self.timestamp_updated = timestamp_updated

    @classmethod
    def from_db_row(cls, row: Tuple[Any, ...]) -> "Order":
        """
        Convert a row tuple from the DB into an Order object.

        row format:
            (id, order_type, stock_symbol, price_per_share,
             number_of_shares, fee, amount, status,
             timestamp_created, timestamp_updated)
        """
        (
            row_id,
            order_type,
            stock_symbol,
            price_per_share,
            number_of_shares,
            fee,
            amount,
            status,
            t_created,
            t_updated
        ) = row

        def parse_ts(ts: Any) -> Optional[datetime]:
            if not ts:
                return None
            try:
                return datetime.fromisoformat(ts)
            except ValueError:
                return datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")

        return cls(
            id_=row_id,
            order_type=order_type,
            stock_symbol=stock_symbol,
            price_per_share=price_per_share,
            number_of_shares=number_of_shares,
            fee=fee,
            amount=amount,
            status=status,
            timestamp_created=parse_ts(t_created),
            timestamp_updated=parse_ts(t_updated),
        )

    @classmethod
    def get_by_id(cls, conn: sqlite3.Connection, order_id: int) -> Optional["Order"]:
        """
        Retrieve a single Order by its primary key (ID).
        """
        query = f"SELECT * FROM {cls.TABLE_NAME} WHERE id=?"
        row = conn.execute(query, (order_id,)).fetchone()
        if row is None:
            return None
        return cls.from_db_row(row)

    @classmethod
    def all(cls, conn: sqlite3.Connection, limit:int = None) -> List["Order"]:
        """
        Retrieve all orders from the database.
        """
        query = f"SELECT * FROM {cls.TABLE_NAME}"
        if limit is not None:
            query += f" LIMIT {limit}"
        rows = conn.execute(query).fetchall()
        return [cls.from_db_row(r) for r in rows]

    @classmethod
    def by_status(
        cls, conn: sqlite3.Connection, statuses: List[str], limit:int = None
    ) -> List["Order"]:
        """
        Returns a list of all orders having any of the specified statuses
        (e.g. ['PENDING', 'EXECUTED', 'CANCELED']).
        """
        placeholders = ','.join('?' for _ in statuses)
        query = f"SELECT * FROM {cls.TABLE_NAME} WHERE status IN ({placeholders})"
        if limit is not None:
            query += f" LIMIT {limit}"
        rows = conn.execute(query, statuses).fetchall()
        return [cls.from_db_row(r) for r in rows]

    def insert(self, conn: sqlite3.Connection) -> None:
        """
        Insert this Order as a new row into the DB.
        """
        if self.id is not None:
            raise ValueError("Cannot insert Order that already has an ID (use update() instead).")

        query = f"""
        INSERT INTO {self.TABLE_NAME}
        (
            order_type,
            stock_symbol,
            price_per_share,
            number_of_shares,
            fee,
            amount,
            status,
            timestamp_created,
            timestamp_updated
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        values = (
            self.order_type,
            self.stock_symbol,
            self.price_per_share,
            self.number_of_shares,
            self.fee,
            self.amount,
            self.status,
            self.timestamp_created,
            self.timestamp_updated,
        )
        cur = conn.execute(query, values)
        self.id = cur.lastrowid

    def update(self, conn: sqlite3.Connection) -> None:
        """
        Update this Order in the DB (matching by `id`).
        """
        if self.id is None:
            raise ValueError("Cannot update Order without an ID (use insert() first).")
        query = f"""
        UPDATE {self.TABLE_NAME}
        SET
            order_type = ?,
            stock_symbol = ?,
            price_per_share = ?,
            number_of_shares = ?,
            fee = ?,
            amount = ?,
            status = ?,
            timestamp_created = ?,
            timestamp_updated = ?
        WHERE id = ?
        """
        values = (
            self.order_type,
            self.stock_symbol,
            self.price_per_share,
            self.number_of_shares,
            self.fee,
            self.amount,
            self.status,
            self.timestamp_created,
            self.timestamp_updated,
            self.id,
        )
        conn.execute(query, values)

    def save(self, conn: sqlite3.Connection) -> None:
        """
        Insert or update depending on whether `id` is set.
        """
        if self.id is None:
            self.insert(conn)
        else:
            self.update(conn)

    def __repr__(self) -> str:
        return (
            f"Order("
            f"id={self.id}, order_type={self.order_type}, symbol={self.stock_symbol}, "
            f"price={self.price_per_share}, shares={self.number_of_shares}, fee={self.fee}, "
            f"amount={self.amount}, status={self.status}, "
            f"timestamp_created={self.timestamp_created}, "
            f"timestamp_updated={self.timestamp_updated})"
        )
