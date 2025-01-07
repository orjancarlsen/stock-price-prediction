# transactions.py
import sqlite3
from datetime import datetime
from typing import Optional, List, Tuple, Any


class Transaction:
    """
    Class representing a row in the `transactions` table.
    """

    TABLE_NAME = "transactions"

    def __init__(
        self,
        transaction_type: str,
        stock_symbol: Optional[str] = None,
        price_per_share: Optional[float] = None,
        number_of_shares: Optional[int] = None,
        fee: float = 0.0,
        amount: float = 0.0,
        timestamp: Optional[datetime] = None,
        id_: Optional[int] = None
    ):
        self.id = id_
        self.transaction_type = transaction_type
        self.stock_symbol = stock_symbol
        self.price_per_share = price_per_share
        self.number_of_shares = number_of_shares
        self.fee = fee
        self.amount = amount
        self.timestamp = timestamp

    @classmethod
    def from_db_row(cls, row: Tuple[Any, ...]) -> "Transaction":
        """
        Convert a row tuple from the DB into a Transaction object.
        """
        # Helper to parse string timestamps if the DB uses text
        def parse_ts(ts: Any) -> Optional[datetime]:
            if not ts:
                return None
            try:
                return datetime.fromisoformat(ts)  # Python 3.7+ 
            except ValueError:
                # fallback if needed for e.g. "YYYY-MM-DD HH:MM:SS"
                return datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
            
        return cls(
            id_=row[0],
            transaction_type=row[1],
            stock_symbol=row[2],
            price_per_share=row[3],
            number_of_shares=row[4],
            fee=row[5],
            amount=row[6],
            timestamp=parse_ts(row[7]),
        )

    @classmethod
    def get_by_id(cls, conn: sqlite3.Connection, transaction_id: int) -> Optional["Transaction"]:
        """
        Retrieve a single Transaction by its primary key.
        """
        query = f"SELECT * FROM {cls.TABLE_NAME} WHERE id=?"
        row = conn.execute(query, (transaction_id,)).fetchone()
        if row is None:
            return None
        return cls.from_db_row(row)

    @classmethod
    def all(cls, conn: sqlite3.Connection) -> List["Transaction"]:
        """
        Retrieve all Transaction rows from the database.
        """
        query = f"SELECT * FROM {cls.TABLE_NAME}"
        rows = conn.execute(query).fetchall()
        return [cls.from_db_row(r) for r in rows]

    def insert(self, conn: sqlite3.Connection) -> None:
        """
        Insert this Transaction as a new row into the DB.
        """
        if self.id is not None:
            raise ValueError("Cannot insert Transaction because it already has an ID.")
        query = f"""
        INSERT INTO {self.TABLE_NAME} 
        (transaction_type, stock_symbol, price_per_share, number_of_shares, fee, amount, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        values = (
            self.transaction_type,
            self.stock_symbol,
            self.price_per_share,
            self.number_of_shares,
            self.fee,
            self.amount,
            self.timestamp
        )
        cur = conn.execute(query, values)
        self.id = cur.lastrowid

    def update(self, conn: sqlite3.Connection) -> None:
        """
        Update this Transaction in the DB based on matching the `id`.
        """
        if self.id is None:
            raise ValueError("Cannot update Transaction without an ID. Use insert() first.")
        query = f"""
        UPDATE {self.TABLE_NAME}
        SET
            transaction_type = ?,
            stock_symbol = ?,
            price_per_share = ?,
            number_of_shares = ?,
            fee = ?,
            amount = ?,
            timestamp = ?
        WHERE id = ?
        """
        values = (
            self.transaction_type,
            self.stock_symbol,
            self.price_per_share,
            self.number_of_shares,
            self.fee,
            self.amount,
            self.timestamp.isoformat(),
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
            f"Transaction(id={self.id}, "
            f"type={self.transaction_type}, "
            f"symbol={self.stock_symbol}, "
            f"price={self.price_per_share}, "
            f"shares={self.number_of_shares}, "
            f"fee={self.fee}, "
            f"amount={self.amount}, "
            f"timestamp={self.timestamp})"
        )
