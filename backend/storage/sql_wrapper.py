"""Module for interacting with the SQLite database."""

import os
import sqlite3
import pprint
from datetime import datetime
from pytz import timezone


class SQLWrapper:
    """
    Class for interacting with the SQLite database.

    Attributes
    ----------
    db_path : str
        Path to the SQLite database file.

    Methods
    -------
    connect()
        Connects to the SQLite database.
    create_tables()
        Reads and executes SQL scripts from `portfolio.sql`, `transactions.sql` and `orders.sql` 
        to create the tables in the database.
    create_buy_order(stock_symbol, price_per_share, number_of_shares, fee=0)
        Creates a new buy order and stores it in the orders table.
    create_sell_order(stock_symbol, price_per_share, number_of_shares, fee=0)
        Creates a new sell order and stores it in the orders table.
    execute_order(order_id)
        Executes a buy or sell order by fetching details from the `orders` table and updating the
        corresponding portfolio, transactions, and order status.
    cancel_order(order_id)
        Cancels a pending buy order by updating its status to 'CANCELED' and timestamp_updated.
        Restores the available cash for canceled BUY orders.
    get_pending_orders()
        Returns a list of all pending orders.
    deposit(amount)
        Deposits the specified amount into the cash balance.
    withdraw(amount)
        Withdraws the specified amount from the cash balance.
    receive_dividend(stock_symbol, dividend_per_share)
        Receives a dividend for the specified stock symbol.
    get_cash_balance()
        Returns the total cash balance.
    get_cash_available()
        Returns the available cash balance.
    get_number_of_shares_for_stock(stock_symbol)
        Returns the number of shares for the specified stock symbol.
    get_number_of_distinct_stocks()
        Returns the number of distinct stocks in the portfolio.
    get_portfolio()
        Returns the portfolio details.
    get_transactions()
        Returns the transaction history.
    get_orders()
        Returns the order history.
    """
    def __init__(self, db_path='storage.db'):
        self.db_path = db_path

    def connect(self):
        """
        Connects to the SQLite database.
        If the database file doesn't exist, it creates a new one and initializes the tables.
        """
        return sqlite3.connect(self.db_path)

    def create_tables(self):
        """
        Reads and executes SQL scripts from `portfolio.sql`, `transactions.sql` and `orders.sql`
        to create the tables in the database.
        """
        sql_files = ["portfolio.sql", "transactions.sql", "orders.sql"]
        base_path = os.path.abspath(os.path.dirname(__file__))

        with self.connect() as conn:
            cursor = conn.cursor()
            for sql_file in sql_files:
                file_path = os.path.join(base_path, sql_file)
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"SQL file not found: {file_path}")
                with open(file_path, "r", encoding="utf-8") as file:
                    sql_script = file.read()
                cursor.executescript(sql_script)

            # Insert the CASH row if it doesn't exist
            cursor.execute('''
                INSERT INTO portfolio (asset_type, stock_symbol, number_of_shares, price_per_share, total_value, available)
                SELECT 'CASH', NULL, NULL, NULL, 0, 0
                WHERE NOT EXISTS (
                    SELECT 1 FROM portfolio WHERE asset_type = 'CASH' AND stock_symbol IS NULL
                )
            ''')

            conn.commit()

    def create_buy_order(self, stock_symbol, price_per_share, number_of_shares, fee=0):
        """
        Creates a new buy order and stores it in the orders table.
        Ensures sufficient cash is available before creating the order.
        """
        total_cost = price_per_share * number_of_shares + fee
        timestamp_created = datetime.now(timezone('Europe/Oslo')).strftime('%Y-%m-%d %H:%M:%S')

        with self.connect() as conn:
            cursor = conn.cursor()

            # Check if sufficient cash is available
            cursor.execute("SELECT available FROM portfolio WHERE asset_type = 'CASH'")
            available_cash = cursor.fetchone()[0]
            if available_cash < total_cost:
                raise ValueError(
                    f"Insufficient available cash to create buy order. "
                    f"Available: ${available_cash}, Required: ${total_cost}"
                )

            # Deduct the amount from available cash
            cursor.execute('''
                UPDATE portfolio
                SET available = available - ?
                WHERE asset_type = 'CASH'
            ''', (total_cost,))

            # Create the buy order
            cursor.execute('''
                INSERT INTO orders (order_type, stock_symbol, price_per_share, number_of_shares, fee, amount, status, timestamp_created)
                VALUES ('BUY', ?, ?, ?, ?, ?, 'PENDING', ?)
            ''', (stock_symbol, price_per_share, number_of_shares,
                  fee, total_cost, timestamp_created))
            conn.commit()
            print(f"Buy order created for {number_of_shares} shares of {stock_symbol} "
                  f"at {price_per_share} per share.")

    def create_sell_order(self, stock_symbol, price_per_share, number_of_shares, fee=0):
        """
        Creates a new sell order and stores it in the orders table.
        Ensures sufficient shares are available before creating the order.
        """
        total_proceeds = price_per_share * number_of_shares - fee
        timestamp_created = datetime.now(timezone('Europe/Oslo')).strftime('%Y-%m-%d %H:%M:%S')

        with self.connect() as conn:
            cursor = conn.cursor()

            # Check if sufficient shares are available to sell
            cursor.execute('''
                SELECT number_of_shares FROM portfolio 
                WHERE asset_type = 'STOCK' AND stock_symbol = ?
            ''', (stock_symbol,))
            result = cursor.fetchone()
            if not result or result[0] < number_of_shares:
                raise ValueError(f"Insufficient shares of {stock_symbol} to create sell order.")

            cursor.execute('''
                INSERT INTO orders (order_type, stock_symbol, price_per_share, number_of_shares, fee, amount, status, timestamp_created)
                VALUES ('SELL', ?, ?, ?, ?, ?, 'PENDING', ?)
            ''', (stock_symbol, price_per_share, number_of_shares, fee, total_proceeds,
                  timestamp_created))
            conn.commit()
            print(f"Sell order created for {number_of_shares} shares of {stock_symbol} "
                  f"at {price_per_share} per share (Fee: ${fee}).")

    def execute_order(self, order_id):
        """
        Executes a buy or sell order by fetching details from the `orders` table
        and updating the corresponding portfolio, transactions, and order status.
        """
        with self.connect() as conn:
            cursor = conn.cursor()

            # Fetch order details
            cursor.execute('''
                SELECT order_type, stock_symbol, price_per_share, number_of_shares, fee, amount, status 
                FROM orders WHERE id = ?
            ''', (order_id,))
            order = cursor.fetchone()
            if not order:
                raise ValueError("Order not found.")

            order_type, stock_symbol, price_per_share, number_of_shares, fee, amount, status = order

            if status != 'PENDING':
                raise ValueError("Order is not in a PENDING state and cannot be executed.")

            # Execute based on order type
            if order_type == 'BUY':
                self._execute_buy_order(
                    cursor, stock_symbol, price_per_share, number_of_shares, fee, amount
                )
            elif order_type == 'SELL':
                self._execute_sell_order(
                    cursor, stock_symbol, price_per_share, number_of_shares, fee, amount
                )

            # Update the order timestamp
            cursor.execute('''
                UPDATE orders
                SET status = 'EXECUTED', timestamp_updated = ?
                WHERE id = ?
            ''', (datetime.now(timezone('Europe/Oslo')).strftime("%Y-%m-%d %H:%M:%S"), order_id))

    def _execute_buy_order(
            self, cursor, stock_symbol, price_per_share, number_of_shares, fee, amount
        ):
        """
        Executes a buy order by updating the portfolio, transactions, and cash balance.
        """

        # Check if sufficient cash is available
        cursor.execute("SELECT total_value FROM portfolio WHERE asset_type = 'CASH'")
        cash = cursor.fetchone()[0]
        if cash < amount:
            raise ValueError("Insufficient cash balance to execute buy order.")
        # Update portfolio for the stock
        cursor.execute('''
            INSERT INTO portfolio (asset_type, stock_symbol, number_of_shares, price_per_share, total_value)
            VALUES ('STOCK', ?, ?, ?, ?)
            ON CONFLICT(asset_type, stock_symbol)
            DO UPDATE SET
                number_of_shares = portfolio.number_of_shares + excluded.number_of_shares,
                price_per_share = 
                    (portfolio.price_per_share * portfolio.number_of_shares + excluded.price_per_share * excluded.number_of_shares) /
                    (portfolio.number_of_shares + excluded.number_of_shares),
                total_value = portfolio.total_value + excluded.total_value
        ''', (stock_symbol, number_of_shares, price_per_share, amount - fee))

        # Deduct the total_value from cash
        cursor.execute('''
            UPDATE portfolio
            SET total_value = total_value - ?
            WHERE asset_type = 'CASH'
        ''', (amount,))

        timestamp = datetime.now(timezone('Europe/Oslo')).strftime('%Y-%m-%d %H:%M:%S')

        # Record the transaction
        cursor.execute('''
            INSERT INTO transactions (transaction_type, stock_symbol, price_per_share, number_of_shares, fee, amount, timestamp)
            VALUES ('BUY', ?, ?, ?, ?, ?, ?)
        ''', (stock_symbol, price_per_share, number_of_shares, fee, amount, timestamp))

    def _execute_sell_order(self, cursor, stock_symbol, price_per_share, number_of_shares, fee, amount):
        """
        Executes a sell order by updating the portfolio, transactions, and cash balance.
        """

        # Check if sufficient shares are available
        cursor.execute('''
            SELECT number_of_shares FROM portfolio 
            WHERE asset_type = 'STOCK' AND stock_symbol = ?
        ''', (stock_symbol,))
        result = cursor.fetchone()
        if not result or result[0] < number_of_shares:
            raise ValueError("Insufficient shares to execute sell order.")

        # Update portfolio for the stock
        cursor.execute('''
            UPDATE portfolio
            SET number_of_shares = number_of_shares - ?, 
                total_value = total_value - (? * price_per_share)
            WHERE asset_type = 'STOCK' AND stock_symbol = ?
        ''', (number_of_shares, number_of_shares, stock_symbol))

        # Remove stock entry if all shares are sold
        cursor.execute('''
            DELETE FROM portfolio
            WHERE asset_type = 'STOCK' AND stock_symbol = ? AND number_of_shares <= 0
        ''', (stock_symbol,))

        # Update cash
        cursor.execute('''
            UPDATE portfolio
            SET total_value = total_value + ?, 
                available = available + ?
            WHERE asset_type = 'CASH'
        ''', (amount, amount))

        timestamp = datetime.now(timezone('Europe/Oslo')).strftime('%Y-%m-%d %H:%M:%S')

        # Record the transaction
        cursor.execute('''
            INSERT INTO transactions (transaction_type, stock_symbol, price_per_share, number_of_shares, fee, amount, timestamp)
            VALUES ('SELL', ?, ?, ?, ?, ?, ?)
        ''', (stock_symbol, price_per_share, number_of_shares, fee, amount, timestamp))

    def cancel_order(self, order_id):
        """
        Cancels a pending buy order by updating its status to 'CANCELED' and timestamp_updated.
        Restores the available cash for canceled BUY orders.
        """
        with self.connect() as conn:
            cursor = conn.cursor()

            # Fetch order details
            cursor.execute('''
                SELECT order_type, price_per_share, number_of_shares, fee, amount, status 
                FROM orders WHERE id = ?
            ''', (order_id,))
            order = cursor.fetchone()
            if not order:
                raise ValueError("Order not found.")
            
            order_type, _, _, _, amount, status = order

            if status != 'PENDING':
                raise ValueError("Order is not in a PENDING state and cannot be canceled.")

            # Restore available cash for canceled BUY orders
            if order_type == 'BUY':
                cursor.execute('''
                    UPDATE portfolio
                    SET available = available + ?
                    WHERE asset_type = 'CASH'
                ''', (amount,))

            # Update the order status and timestamp
            cursor.execute('''
                UPDATE orders
                SET status = 'CANCELED', timestamp_updated = ?
                WHERE id = ?
            ''', (datetime.now(timezone('Europe/Oslo')), order_id))

    def get_pending_orders(self):
        """
        Returns a list of all pending orders.
        """
        with self.connect() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM orders WHERE status = 'PENDING'
            ''')
            return cursor.fetchall()

    def deposit(self, amount):
        """
        Deposits the specified amount into the cash balance.
        """
        if amount <= 0:
            raise ValueError("Deposit amount must be positive.")

        with self.connect() as conn:
            cursor = conn.cursor()

            # Update cash
            cursor.execute('''
                UPDATE portfolio
                SET total_value = total_value + ?,
                    available = available + ?
                WHERE asset_type = 'CASH'
            ''', (amount,amount))

            # Record the transaction
            cursor.execute('''
                INSERT INTO transactions (transaction_type, amount)
                VALUES ('DEPOSIT', ?)
            ''', (amount,))

    def withdraw(self, amount):
        """
        Withdraws the specified amount from the cash balance.
        """
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive.")

        with self.connect() as conn:
            cursor = conn.cursor()

            # Check if sufficient cash is available
            cursor.execute("SELECT total_value FROM portfolio WHERE asset_type = 'CASH'")
            cash = cursor.fetchone()[0]
            if cash < amount:
                raise ValueError("Insufficient cash balance to withdraw.")

            # Update cash
            cursor.execute('''
                UPDATE portfolio
                SET total_value = total_value - ?,
                    available = available - ?
                WHERE asset_type = 'CASH'
            ''', (amount,amount))

            # Record the transaction
            cursor.execute('''
                INSERT INTO transactions (transaction_type, amount)
                VALUES ('WITHDRAW', ?)
            ''', (amount,))

    def receive_dividend(self, stock_symbol, dividend_per_share):
        """
        Receives dividend for a stock and updates the cash balance.
        """
        if dividend_per_share <= 0:
            raise ValueError("Dividend amount must be positive.")

        with self.connect() as conn:
            cursor = conn.cursor()

            # Check if the stock exists in the portfolio
            cursor.execute('''
                SELECT number_of_shares FROM portfolio 
                WHERE asset_type = 'STOCK' AND stock_symbol = ?
            ''', (stock_symbol,))
            result = cursor.fetchone()
            if not result:
                raise ValueError(f"No shares of {stock_symbol} found in the portfolio.")

            number_of_shares = result[0]
            total_dividend = number_of_shares * dividend_per_share

            # Update cash
            cursor.execute('''
                UPDATE portfolio
                SET total_value = total_value + ?,
                    available = available + ?
                WHERE asset_type = 'CASH'
            ''', (total_dividend,total_dividend))

            # Record the transaction
            cursor.execute('''
                INSERT INTO transactions (transaction_type, stock_symbol, price_per_share, number_of_shares, amount)
                VALUES ('DIVIDEND', ?, ?, ?, ?)
            ''', (stock_symbol, dividend_per_share, number_of_shares, total_dividend))

    def get_cash_balance(self):
        """
        Returns the total cash balance.
        """
        with self.connect() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT total_value FROM portfolio WHERE asset_type = 'CASH'")
            return cursor.fetchone()[0]

    def get_cash_available(self):
        """
        Returns the available cash balance.
        """
        with self.connect() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT available FROM portfolio WHERE asset_type = 'CASH'")
            return cursor.fetchone()[0]

    def get_number_of_shares_for_stock(self, stock_symbol):
        """
        Returns the number of shares for a given stock symbol.
        """
        with self.connect() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT number_of_shares FROM portfolio 
                WHERE asset_type = 'STOCK' AND stock_symbol = ?
            ''', (stock_symbol,))
            result = cursor.fetchone()
            return result[0] if result else 0

    def get_number_of_distinct_stocks(self):
        """
        Returns the number of distinct stocks in the portfolio.
        """
        with self.connect() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT COUNT(*) FROM portfolio 
                WHERE asset_type = 'STOCK'
            ''')
            return cursor.fetchone()[0]

    def get_portfolio(self):
        """
        Returns the portfolio details.
        """
        with self.connect() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM portfolio
            ''')
            return cursor.fetchall()

    def get_transactions(self):
        """
        Returns the transaction details.
        """
        with self.connect() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM transactions
            ''')
            return cursor.fetchall()

    def get_orders(self):
        """
        Returns the order details.
        """
        with self.connect() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM orders
            ''')
            return cursor.fetchall()

if __name__ == "__main__":
    sql_wrapper = SQLWrapper()
    sql_wrapper.create_tables()

    # Initial cash deposit
    # sql_wrapper.deposit(100000)

    # sql_wrapper.create_buy_order('AAPL', 180, 10)

    # sql_wrapper.execute_order(3)

    # sql_wrapper.create_sell_order('AAPL', 200, 10, 20)

    # sql_wrapper.execute_order(6)

    # sql_wrapper.create_buy_order('NOD.OL', 180, 10, 5)

    # sql_wrapper.cancel_order(7)

    # sql_wrapper.create_buy_order('AAPL', 180, 10)

    # print(sql_wrapper.get_pending_orders())

    # sql_wrapper.cancel_order(8)

    # sql_wrapper.withdraw(1178.01)

    # print(sql_wrapper.get_cash_balance())
    # print(sql_wrapper.get_cash_available())

    # sql_wrapper.create_buy_order('NOD', 110, 40)
    # sql_wrapper.execute_order(11)
    # sql_wrapper.receive_dividend('AAPL', 2)

    # sql_wrapper.create_sell_order('AAPL', 200, 10, 20)
    # sql_wrapper.execute_order(12)

    # sql_wrapper.create_buy_order('AAPL', 180, 10)
    # sql_wrapper.execute_order(13)

    # print(sql_wrapper.get_number_of_distinct_stocks())

    # Summary
    pprint.pp(sql_wrapper.get_portfolio())
    pprint.pp(sql_wrapper.get_transactions())
    pprint.pp(sql_wrapper.get_orders())
