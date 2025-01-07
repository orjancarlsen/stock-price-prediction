"""Module for interacting with the SQLite database."""

import os
import sqlite3
import pprint
from datetime import datetime
from pytz import timezone

from src.storage.transactions import Transaction
from src.storage.orders import Order
from src.storage.portfolio import Portfolio


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
    create_buy_order(stock_symbol, price_per_share, number_of_shares, fee=0.0)
        Creates a new buy order and stores it in the orders table.
    create_sell_order(stock_symbol, price_per_share, number_of_shares, fee=0.0)
        Creates a new sell order and stores it in the orders table.
    execute_order(order_id, _price_per_share=None, _fee=None)
        Executes a buy or sell order by fetching details from the `orders` table and updating the
        corresponding portfolio, transactions, and order status.
    cancel_order(order_id)
        Cancels a pending buy order by updating its status to 'CANCELED' and timestamp_updated.
        Restores the available cash for canceled BUY orders.
    get_orders()
        Retrieve all orders as a list of Order objects.
    get_orders_by_status(status)
        Returns a list of orders filtered by a specific status.
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
    get_portfolio()
        Returns all rows in the portfolio as Portfolio objects.
    get_portfolio_value()
        Returns the total value of the portfolio.
    get_number_of_shares_for_stock(stock_symbol)
        Returns the number of shares for a given stock symbol.
    get_number_of_distinct_stocks()
        Returns the number of distinct stocks in the portfolio.
    get_stock_in_portfolio(stock_symbol)
        Returns the portfolio row for a given stock symbol.
    get_transactions()
        Returns the transaction history as a list of Transaction objects.
    """
    def __init__(self, db_path: str = None):
        if db_path is None:
            base_path = os.path.abspath(os.path.dirname(__file__))
            db_path = os.path.join(base_path, 'storage.db')
        self.db_path = db_path

    def connect(self):
        """
        Connects to the SQLite database.
        If the database file doesn't exist, it creates a new one and initializes the tables.
        """
        return sqlite3.connect(self.db_path)

    # ----------------------------------------------------------------------
    # Orders
    # ----------------------------------------------------------------------

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
                INSERT INTO portfolio (asset_type, stock_symbol, number_of_shares, price_per_share,
                    total_value, available)
                SELECT 'CASH', NULL, NULL, NULL, 0, 0
                WHERE NOT EXISTS (
                    SELECT 1 FROM portfolio WHERE asset_type = 'CASH' AND stock_symbol IS NULL
                )
            ''')

            conn.commit()

    def create_buy_order(
            self,
            stock_symbol: str,
            price_per_share: float,
            number_of_shares: int,
            fee: float = 0.0
        ):
        """
        Creates a new buy order and stores it in the orders table.
        Ensures sufficient cash is available before creating the order.
        """
        total_cost = price_per_share * number_of_shares + fee
        timestamp_created = datetime.now(timezone('Europe/Oslo')).strftime('%Y-%m-%d %H:%M:%S')

        with self.connect() as conn:
            # Check if sufficient cash is available
            cash = Portfolio.get_by_key(conn, "CASH", None)
            if not cash or cash.available < total_cost:
                raise ValueError(
                    f"Insufficient available cash to create buy order. "
                    f"Available: ${cash.available if cash else 0}, "
                    f"Required: ${total_cost}"
                )

            # Deduct from available cash
            cash.available -= total_cost
            cash.save(conn)

            # Create an BUY Order
            buy_order = Order(
                order_type="BUY",
                stock_symbol=stock_symbol,
                price_per_share=price_per_share,
                number_of_shares=number_of_shares,
                fee=fee,
                amount=total_cost,
                status="PENDING",
                timestamp_created=timestamp_created
            )
            buy_order.insert(conn)
            print(f"Buy order created: {buy_order}")


    def create_sell_order(
            self,
            stock_symbol: str,
            price_per_share: float,
            number_of_shares: int,
            fee: float = 0.0
        ):
        """
        Creates a new sell order and stores it in the orders table.
        Ensures sufficient shares are available before creating the order.
        """
        total_proceeds = price_per_share * number_of_shares - fee
        timestamp_created = datetime.now(timezone('Europe/Oslo')).strftime('%Y-%m-%d %H:%M:%S')

        with self.connect() as conn:
            # Check if sufficient shares are available
            stock = Portfolio.get_by_key(conn, "STOCK", stock_symbol)
            if not stock or stock.number_of_shares < number_of_shares:
                raise ValueError(
                    f"Insufficient shares of {stock_symbol} to create sell order. "
                    f"Available: {stock.number_of_shares if stock else 0}, "
                    f"Required: {number_of_shares}"
                )

            # Create an SELL Order
            sell_order = Order(
                order_type="SELL",
                stock_symbol=stock_symbol,
                price_per_share=price_per_share,
                number_of_shares=number_of_shares,
                fee=fee,
                amount=total_proceeds,
                status="PENDING",
                timestamp_created=timestamp_created
            )
            sell_order.insert(conn)
            print(f"Sell order created: {sell_order}")

    def execute_order(self, order_id: int, _price_per_share: float = None, _fee: float = None):
        """
        Executes a buy or sell order by fetching details from the `orders` table
        and updating the corresponding portfolio, transactions, and order status.

        Parameters
        ----------
        order_id : int
            The ID of the order to execute
        _price_per_share : float, optional
            The price per share to override the price_per_shar registered for the order. 
            If not provided, the price per share from the order details is used.
        """
        with self.connect() as conn:
            order = Order.get_by_id(conn, order_id)
            if not order:
                raise ValueError(f"Order {order_id} not found.")

            if order.status != "PENDING":
                raise ValueError(f"Order {order_id} is not in PENDING state.")

            # If the given price in the order is overridden, use it
            # Can happen if the open price on a stock with a buy order is lower than the price in
            # the order, or if the open price on a stock with a sell order is higher than the price
            # in the order.
            # In that case, a new fee should always have be calculated based on the new price.
            if _price_per_share is not None:
                order.price_per_share = _price_per_share

            if _fee is not None:
                order.fee = _fee

            # Execute based on order type
            cursor = conn.cursor()
            if order.order_type == 'BUY':
                order.amount = order.price_per_share * order.number_of_shares + order.fee

                # Update available cash, correct amount is deducted in _execute_buy_order
                cash_port = Portfolio.get_by_key(conn, "CASH", None)
                if cash_port:
                    cash_port.available += order.amount
                    cash_port.save(conn)

                print(f"Executing buy order: {order}")
                self._execute_buy_order(cursor, order, conn)

            elif order.order_type == 'SELL':
                order.amount = order.price_per_share * order.number_of_shares - order.fee

                print(f"Executing sell order: {order}")
                self._execute_sell_order(order, conn)

            # Mark the order as EXECUTED
            order.status = "EXECUTED"
            order.timestamp_updated = datetime.now(
                timezone('Europe/Oslo')
            ).strftime("%Y-%m-%d %H:%M:%S")
            order.save(conn)

    def _execute_buy_order(self, cursor: sqlite3.Cursor, order: Order, conn: sqlite3.Connection):
        """
        Executes a buy order by updating the portfolio, transactions, and cash balance.
        """

        # Check if sufficient cash is available
        cash_port = Portfolio.get_by_key(conn, "CASH", None)
        if not cash_port or cash_port.total_value < order.amount:
            raise ValueError(
                f"Insufficient total cash balance to execute buy order. "
                f"Available: ${cash_port.total_value if cash_port else 0}, "
                f"Required: ${order.amount}"
            )

        # Update portfolio for the stock
        cursor.execute('''
            INSERT INTO portfolio (asset_type, stock_symbol, number_of_shares, price_per_share,
                total_value)
            VALUES ('STOCK', ?, ?, ?, ?)
            ON CONFLICT(asset_type, stock_symbol)
            DO UPDATE SET
                number_of_shares = portfolio.number_of_shares + excluded.number_of_shares,
                price_per_share = 
                    (portfolio.price_per_share * portfolio.number_of_shares + 
                       excluded.price_per_share * excluded.number_of_shares) /
                    (portfolio.number_of_shares + excluded.number_of_shares),
                total_value = portfolio.total_value + excluded.total_value
        ''', (
            order.stock_symbol,
            order.number_of_shares,
            order.price_per_share,
            order.amount - order.fee
        ))

        # Deduct the total_value from cash
        cash_port.total_value -= order.amount
        cash_port.available -= order.amount
        cash_port.save(conn)

        # Create and insert a BUY Transaction
        buy_txn = Transaction(
            transaction_type="BUY",
            stock_symbol=order.stock_symbol,
            price_per_share=order.price_per_share,
            number_of_shares=order.number_of_shares,
            fee=order.fee,
            amount=order.amount,
            timestamp=datetime.now(timezone('Europe/Oslo')).strftime('%Y-%m-%d %H:%M:%S')
        )
        buy_txn.insert(conn)

    def _execute_sell_order(self, order: Order, conn: sqlite3.Connection):
        """
        Executes a sell order by updating the portfolio, transactions, and cash balance.
        """

        # Check if sufficient shares are available
        stock_port = Portfolio.get_by_key(conn, "STOCK", order.stock_symbol)
        if not stock_port or stock_port.number_of_shares < order.number_of_shares:
            raise ValueError(
                f"Insufficient shares to execute sell order, "
                f"Available: {stock_port.number_of_shares if stock_port else 0}, "
                f"Required: {order.number_of_shares}"
            )

        # Update portfolio for the stock
        stock_port.number_of_shares -= order.number_of_shares
        stock_port.total_value -= (order.number_of_shares * stock_port.price_per_share)
        if stock_port.number_of_shares <= 0:
            stock_port.delete(conn)
        else:
            stock_port.save(conn)

        # Update cash
        cash_port = Portfolio.get_by_key(conn, "CASH", None)
        cash_port.total_value += order.amount
        cash_port.available += order.amount
        cash_port.save(conn)

        # Create and insert a SELL Transaction
        sell_txn = Transaction(
            transaction_type="SELL",
            stock_symbol=order.stock_symbol,
            price_per_share=order.price_per_share,
            number_of_shares=order.number_of_shares,
            fee=order.fee,
            amount=order.amount,
            timestamp=datetime.now(timezone('Europe/Oslo')).strftime('%Y-%m-%d %H:%M:%S')
        )
        sell_txn.insert(conn)

    def cancel_order(self, order_id: int):
        """
        Cancels a pending buy order by updating its status to 'CANCELED' and timestamp_updated.
        Restores the available cash for canceled BUY orders.
        """
        with self.connect() as conn:
            order = Order.get_by_id(conn, order_id)
            if not order:
                raise ValueError(f"Order {order_id} not found.")
            if order.status != "PENDING":
                raise ValueError("Order is not in PENDING state; cannot cancel.")

            # If it's a BUY, restore the previously-deducted cash
            if order.order_type == "BUY":
                cash_port = Portfolio.get_by_key(conn, "CASH", None)
                if cash_port:
                    cash_port.available += order.amount
                    cash_port.save(conn)

            # Update the Order as CANCELED
            order.status = "CANCELED"
            order.timestamp_updated = datetime.now(
                timezone('Europe/Oslo')
            ).strftime('%Y-%m-%d %H:%M:%S')
            order.save(conn)

    def get_orders(self):
        """
        Retrieve all orders as a list of Order objects.
        """
        with self.connect() as conn:
            return Order.all(conn)

    def get_orders_by_status(self, status: str):
        """
        Returns a list of orders filtered by a specific status.
        """
        with self.connect() as conn:
            return Order.by_status(conn, status)

    # ----------------------------------------------------------------------
    # Transactions & Cash
    # ----------------------------------------------------------------------

    def deposit(self, amount: float):
        """
        Deposits the specified amount into the cash balance.
        """
        if amount <= 0:
            raise ValueError(f"Deposit amount must be positive, amount: {amount}")

        with self.connect() as conn:
            # Update cash
            cash_port = Portfolio.get_by_key(conn, "CASH", None)
            cash_port.total_value += amount
            cash_port.available += amount
            cash_port.save(conn)

            # Create and insert a DEPOSIT
            dep_txn = Transaction(
                transaction_type="DEPOSIT",
                amount=amount,
                timestamp=datetime.now(timezone('Europe/Oslo')).strftime('%Y-%m-%d %H:%M:%S')
            )
            dep_txn.insert(conn)

    def withdraw(self, amount: float):
        """
        Withdraws the specified amount from the cash balance.
        """
        if amount <= 0:
            raise ValueError(f"Withdrawal amount must be positive, amount: {amount}.")

        with self.connect() as conn:
            cash_port = Portfolio.get_by_key(conn, "CASH", None)
            if not cash_port or cash_port.total_value < amount or cash_port.available < amount:
                raise ValueError(
                    f"Insufficient cash balance to withdraw, "
                    f"Available: ${cash_port.available if cash_port else 0}, "
                    f"Total: ${cash_port.total_value if cash_port else 0}, "
                    f"Required: ${amount}"
                )

            # Update cash
            cash_port.total_value -= amount
            cash_port.available -= amount
            cash_port.save(conn)

            # Create and insert a Transaction (WITHDRAW)
            withdraw_txn = Transaction(
                transaction_type="WITHDRAW",
                amount=amount,
                timestamp=datetime.now(timezone('Europe/Oslo')).strftime('%Y-%m-%d %H:%M:%S')
            )
            withdraw_txn.insert(conn)

    def receive_dividend(self, stock_symbol: str, dividend_per_share: float):
        """
        Receives dividend for a stock and updates the cash balance.
        """
        if dividend_per_share <= 0:
            raise ValueError(
                f"Dividend amount must be positive, dividend_per_share: {dividend_per_share}."
            )

        with self.connect() as conn:
            # Check if the stock exists in the portfolio
            stock_port = Portfolio.get_by_key(conn, "STOCK", stock_symbol)
            if not stock_port or not stock_port.number_of_shares:
                raise ValueError(f"No shares of {stock_symbol} found in the portfolio.")

            total_dividend = stock_port.number_of_shares * dividend_per_share

            # Update cash
            cash_port = Portfolio.get_by_key(conn, "CASH", None)
            cash_port.total_value += total_dividend
            cash_port.available += total_dividend
            cash_port.save(conn)

            # Create a DIVIDEND transaction
            dividend_txn = Transaction(
                transaction_type="DIVIDEND",
                stock_symbol=stock_symbol,
                price_per_share=dividend_per_share,
                number_of_shares=stock_port.number_of_shares,
                amount=total_dividend,
                timestamp=datetime.now(timezone('Europe/Oslo')).strftime('%Y-%m-%d %H:%M:%S')
            )
            dividend_txn.insert(conn)

    # ----------------------------------------------------------------------
    # Portfolio
    # ----------------------------------------------------------------------

    def get_cash_balance(self):
        """
        Returns the total cash balance.
        """
        with self.connect() as conn:
            cash_row = Portfolio.get_by_key(conn, "CASH", None)
            return cash_row.total_value if cash_row else 0.0

    def get_cash_available(self):
        """
        Returns the available cash balance.
        """
        with self.connect() as conn:
            cash_row = Portfolio.get_by_key(conn, "CASH", None)
            return cash_row.available if cash_row else 0.0

    def get_portfolio(self):
        """
        Returns all rows in the portfolio as Portfolio objects.
        """
        with self.connect() as conn:
            return Portfolio.all(conn)

    def get_portfolio_value(self):
        """
        Returns the total value of the portfolio.
        """
        with self.connect() as conn:
            portfolio_rows = Portfolio.all(conn)
            return sum(row.total_value for row in portfolio_rows)

    def get_number_of_shares_for_stock(self, stock_symbol):
        """
        Returns the number of shares for a given stock symbol.
        """
        with self.connect() as conn:
            stock_port = Portfolio.get_by_key(conn, "STOCK", stock_symbol)
            return stock_port.number_of_shares if stock_port else 0

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

    def get_stock_in_portfolio(self, stock_symbol: str):
        """
        Returns the portfolio row for a given stock symbol.
        """
        with self.connect() as conn:
            return Portfolio.get_by_key(conn, "STOCK", stock_symbol)

    # ----------------------------------------------------------------------
    # Transactions
    # ----------------------------------------------------------------------

    def get_transactions(self):
        """
        Now return Transaction objects instead of raw tuples.
        """
        with self.connect() as conn:
            return Transaction.all(conn)

if __name__ == "__main__":
    sql_wrapper = SQLWrapper()
    sql_wrapper.create_tables()

    # Initial cash deposit
    # sql_wrapper.deposit(100000)

    # sql_wrapper.create_buy_order('AAPL', 258, 10, 15)

    # sql_wrapper.execute_order(1)

    # sql_wrapper.create_sell_order('AAPL', 200, 10, 20)

    # sql_wrapper.execute_order(2)

    # sql_wrapper.create_buy_order('NOD.OL', 180, 10, 5)

    # sql_wrapper.cancel_order(7)

    # sql_wrapper.create_buy_order('AAPL', 180, 10)

    # print(sql_wrapper.get_orders_by_status('PENDING'))

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
