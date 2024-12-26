"""Module to test the SQLWrapper class."""

import os
import pytest
from src.storage.sql_wrapper import SQLWrapper

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
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM portfolio")
        portfolio = cursor.fetchall()
        cursor.execute("SELECT * FROM transactions")
        transactions = cursor.fetchall()
        cursor.execute("SELECT * FROM orders")
        orders = cursor.fetchall()

    assert len(portfolio) == 1
    assert portfolio[0][0] == 'CASH'
    assert portfolio[0][4] == 0  # total_value
    assert portfolio[0][5] == 0  # available
    assert len(transactions) == 0
    assert len(orders) == 0

    # 2. Deposit 110000
    wrapper.deposit(110000)
    assert wrapper.get_cash_balance() == 110000
    assert wrapper.get_cash_available() == 110000
    transactions = wrapper.get_transactions()
    assert len(transactions) == 1
    assert transactions[0][1] == 'DEPOSIT'

    # 3. Withdraw 10000
    wrapper.withdraw(10000)
    assert wrapper.get_cash_balance() == 100000
    assert wrapper.get_cash_available() == 100000
    transactions = wrapper.get_transactions()
    assert len(transactions) == 2
    assert transactions[1][1] == 'WITHDRAW'

    # 4. Create a buy order of 100 AAPL shares to 200kr each
    wrapper.create_buy_order("AAPL", price_per_share=200, number_of_shares=100)
    assert wrapper.get_cash_available() == 80000
    orders = wrapper.get_pending_orders()
    assert len(orders) == 1
    assert orders[0][1] == 'BUY'

    # 5. Execute the buy order
    wrapper.execute_order(orders[0][0])
    portfolio = wrapper.get_portfolio()
    assert any(row[1] == "AAPL" and row[2] == 100 for row in portfolio)  # Check AAPL in portfolio
    assert wrapper.get_cash_balance() == 80000
    transactions = wrapper.get_transactions()
    assert len(transactions) == 3  # Includes 1 deposit, 1 withdraw and 1 buy

    # 6. Create a buy order of 10 NOD shares to 100kr each
    wrapper.create_buy_order("NOD", price_per_share=100, number_of_shares=10)
    assert wrapper.get_cash_available() == 79000
    orders = wrapper.get_pending_orders()
    assert len(orders) == 1

    # 7. Execute the buy order
    wrapper.execute_order(orders[0][0])
    portfolio = wrapper.get_portfolio()
    assert any(row[1] == "NOD" and row[2] == 10 for row in portfolio)  # Check NOD in portfolio
    assert wrapper.get_cash_balance() == 79000
    transactions = wrapper.get_transactions()
    assert len(transactions) == 4  # Includes 1 deposit, 1 withdraw and 2 buys

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
    orders = wrapper.get_pending_orders()
    assert len(orders) == 1
    assert orders[0][1] == 'SELL'
    assert orders[0][2] == "AAPL"
    assert wrapper.get_cash_available() == 79000

    # 12. Execute the sell order
    wrapper.execute_order(orders[0][0])
    portfolio = wrapper.get_portfolio()
    assert any(row[1] == "AAPL" and row[2] == 50 for row in portfolio)
    assert wrapper.get_cash_balance() == 91500
    assert wrapper.get_cash_available() == 91500
    transactions = wrapper.get_transactions()
    assert len(transactions) == 5  # Includes 1 deposit, 1 withdraw, 2 buys and 1 sell
