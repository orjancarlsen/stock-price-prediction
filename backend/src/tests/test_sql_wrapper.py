"""Module to test the SQLWrapper class."""

import os
import pytest

from src.storage.sql_wrapper import SQLWrapper
from src.storage.portfolio import Portfolio
from src.storage.transactions import Transaction
from src.storage.orders import Order

@pytest.fixture
def wrapper():
    """
    Fixture to provide a fresh instance of SQLWrapper and reset the database for each test.
    """
    db_name = 'storage_test.db'
    if os.path.exists(db_name):
        try:
            os.remove(db_name)
        except PermissionError:
            pass
    return SQLWrapper(db_path=db_name)

def test_sql_wrapper_init(wrapper): # pylint: disable=redefined-outer-name
    """
    Test the initialization of the SQLWrapper class.
    """
    assert wrapper.db_path == 'storage_test.db'
    assert wrapper.connect() is not None

def test_sql_wrapper_create_tables(wrapper): # pylint: disable=redefined-outer-name
    """
    Test the creation of tables in the database.
    """
    wrapper.create_tables()
    with wrapper.connect() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
    tables = [table for table in tables if table[0] != 'sqlite_sequence']
    assert len(tables) == 3
    assert ('portfolio',) in tables
    assert ('transactions',) in tables
    assert ('orders',) in tables

def test_sql_wrapper_sequence(wrapper): # pylint: disable=too-many-statements, redefined-outer-name
    """
    Test a squence of database actions:
    1. Create tables
    2. Deposit 110000
    3. Withdraw 10000
    4. Buy order of 100 AAPL shares to 200kr
    5. Execute buy order
    6. Buy order of 10 NOD shares to 100kr each
    7. Execute buy order
    8. Try to sell 150 AAPL shares
    9. Try to sell 1 MSFT share
    10. Try to place a buy order for 1000 MSFT shares at 2500kr each
    11. Sell order for 50 AAPL shares
    12. Execute sell order
    """

    # 1. Init SQLWrapper and create tables
    wrapper.create_tables()
    with wrapper.connect() as conn:
        portfolio = Portfolio.all(conn)
        transactions = Transaction.all(conn)
        orders = Order.all(conn)

    assert len(portfolio) == 1
    cash_row = portfolio[0]
    assert cash_row.asset_type == 'CASH'
    assert cash_row.total_value == 0
    assert cash_row.available == 0
    assert len(transactions) == 0
    assert len(orders) == 0

    # 2. Deposit 110000
    wrapper.deposit(110000)
    assert wrapper.get_cash_balance() == 110000
    assert wrapper.get_cash_available() == 110000
    transactions = wrapper.get_transactions()
    assert len(transactions) == 1
    assert transactions[0].transaction_type == 'DEPOSIT'
    assert transactions[0].amount == 110000

    # 3. Withdraw 10000
    wrapper.withdraw(10000)
    assert wrapper.get_cash_balance() == 100000
    assert wrapper.get_cash_available() == 100000
    transactions = wrapper.get_transactions()
    assert len(transactions) == 2
    assert transactions[1].transaction_type == 'WITHDRAW'
    assert transactions[1].amount == 10000

    # 4. Create a buy order of 100 AAPL shares to 200kr each
    wrapper.create_buy_order("AAPL", price_per_share=200, number_of_shares=100)
    assert wrapper.get_cash_available() == 80000
    orders = wrapper.get_orders_by_status('PENDING')
    assert len(orders) == 1
    buy_order = orders[0]
    assert buy_order.order_type == 'BUY'
    assert buy_order.stock_symbol == 'AAPL'
    assert buy_order.number_of_shares == 100
    assert buy_order.price_per_share == 200

    # 5. Execute the buy order
    wrapper.execute_order(buy_order.id)
    portfolio = wrapper.get_portfolio()
    assert any(row.stock_symbol == "AAPL" and row.number_of_shares == 100 for row in portfolio)  # Check AAPL in portfolio
    assert wrapper.get_cash_balance() == 80000
    transactions = wrapper.get_transactions()
    assert len(transactions) == 3  # DEPOSIT, WITHDRAW, BUY
    buy_txn = [t for t in transactions if t.transaction_type == "BUY"]
    assert len(buy_txn) == 1
    assert buy_txn[0].stock_symbol == "AAPL"
    assert buy_txn[0].number_of_shares == 100

    # 6. Create a buy order of 10 NOD shares to 100kr each
    wrapper.create_buy_order("NOD", price_per_share=100, number_of_shares=10)
    assert wrapper.get_cash_available() == 79000
    orders_pending = wrapper.get_orders_by_status('PENDING')
    assert len(orders_pending) == 1

    # 7. Execute the buy order
    wrapper.execute_order(orders_pending[0].id)
    portfolio = wrapper.get_portfolio()
    assert any(row.stock_symbol == "NOD" and row.number_of_shares == 10 for row in portfolio)  # Check NOD in portfolio
    assert wrapper.get_cash_balance() == 79000
    transactions = wrapper.get_transactions()
    assert len(transactions) == 4  # DEPOSIT, WITHDRAW, BUY(AAPL), BUY(NOD)

    # 8. Try to sell 150 AAPL shares
    with pytest.raises(ValueError):
        wrapper.create_sell_order("AAPL", price_per_share=200, number_of_shares=150)

    # 9. Try to sell 1 MSFT share
    with pytest.raises(ValueError):
        wrapper.create_sell_order("MSFT", price_per_share=200, number_of_shares=1)

    # 10. Try to place a buy order for 1000 MSFT shares at 2500kr each
    with pytest.raises(ValueError):
        wrapper.create_buy_order("MSFT", price_per_share=2500, number_of_shares=1000)

    # 11. Place a sell order for 50 AAPL shares
    wrapper.create_sell_order("AAPL", price_per_share=250, number_of_shares=50)
    orders = wrapper.get_orders_by_status('PENDING')
    assert len(orders) == 1
    sell_order = orders[0]
    assert sell_order.order_type == 'SELL'
    assert sell_order.stock_symbol == "AAPL"
    assert sell_order.number_of_shares == 50
    assert wrapper.get_cash_available() == 79000
    assert wrapper.get_cash_balance() == 79000

    # 12. Execute the sell order
    wrapper.execute_order(sell_order.id)
    portfolio = wrapper.get_portfolio()
    assert any(row.stock_symbol == "AAPL" and row.number_of_shares == 50 for row in portfolio)
    assert wrapper.get_cash_balance() == 91500
    assert wrapper.get_cash_available() == 91500

    transactions = wrapper.get_transactions()
    assert len(transactions) == 5  # DEPOSIT, WITHDRAW, BUY(AAPL), BUY(NOD), SELL(AAPL)
    sell_txn = [t for t in transactions if t.transaction_type == "SELL"]
    assert len(sell_txn) == 1
    assert sell_txn[0].stock_symbol == "AAPL"
    assert sell_txn[0].number_of_shares == 50
    assert sell_txn[0].price_per_share == 250

