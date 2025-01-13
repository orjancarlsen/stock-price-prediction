"""Model class for the `portfolio_values` table."""

import sqlite3
from datetime import datetime
from typing import List, Tuple, Optional

class PortfolioValue:
    """
    Class representing a row in the `portfolio_values` table.

    Provides convenience methods for creating the table, inserting,
    and retrieving portfolio value records.
    """

    TABLE_NAME = "portfolio_values"

    def __init__(
        self,
        date: datetime,
        value: float,
    ):
        self.date = date
        self.value = value

    @classmethod
    def from_db_row(cls, row: Tuple) -> "PortfolioValue":
        """
        Convert a row tuple from the DB into a PortfolioValue object.

        row format:
            (id, date, value)
        """
        date, value = row
        return cls(
            date=date,
            value=value,
        )

    @classmethod
    def get_by_id(cls, conn: sqlite3.Connection, date_: datetime) -> Optional["PortfolioValue"]:
        """
        Retrieve a single PortfolioValue by its primary key (ID).
        """
        query = f"SELECT * FROM {cls.TABLE_NAME} WHERE date=?"
        row = conn.execute(query, (date_,)).fetchone()
        if row is None:
            return None
        return cls.from_db_row(row)

    @classmethod
    def all(cls, conn: sqlite3.Connection) -> List["PortfolioValue"]:
        """
        Retrieve all portfolio values from the database.
        """
        query = f"SELECT * FROM {cls.TABLE_NAME} ORDER BY date ASC"
        rows = conn.execute(query).fetchall()
        return [cls.from_db_row(row) for row in rows]

    def insert(self, conn: sqlite3.Connection) -> None:
        """
        Insert this PortfolioValue as a new row into the DB.
        """
        query = f"""
        INSERT INTO {self.TABLE_NAME}
        (
            date,
            value
        )
        VALUES (?, ?)
        """
        values = (
            self.date.isoformat(),
            self.value,
        )
        conn.execute(query, values)

    def update(self, conn: sqlite3.Connection) -> None:
        """
        Update this PortfolioValue in the DB (matching by `id`).
        """
        query = f"""
        UPDATE {self.TABLE_NAME}
        SET
            date = ?,
            value = ?
        WHERE date = ?
        """
        values = (
            self.date.isoformat(),
            self.value,
            self.date.isoformat(),
        )
        conn.execute(query, values)

    @classmethod
    def delete(cls, conn: sqlite3.Connection, date: datetime) -> None:
        """
        Delete this PortfolioValue from the DB.
        """
        query = f"DELETE FROM {cls.TABLE_NAME} WHERE date = ?"
        conn.execute(query, (date,))

    def __repr__(self):
        return f"PortfolioValue(date={self.date}, value={self.value})"
