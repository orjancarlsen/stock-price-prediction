import React, { useState, ChangeEvent } from 'react';
import Transactions from './components/transactions/Transactions';
import Orders from './components/orders/Orders';
import Portfolio from './components/portfolio/Portfolio';
import LoadingAnimation from './components/LoadingAnimation';
import { useFetchCompanies } from './hooks/useFetchCompanies';
import { useFetchTransactions } from './hooks/useFetchTransactions';
import { useFetchOrders } from './hooks/useFetchOrders';
import { useFetchPortfolio } from './hooks/useFetchPortfolio';
import { useFetchPortfolioValues } from './hooks/useFetchPortfolioValues';
import ContentSwitch from './components/ContentSwitch';

function App() {
  const [view, setView] = useState<'orders' | 'transactions'>('transactions');

  // Fetch calls
  const {
    companies: trainedCompanies,
    error: trainedCompaniesError,
    loading: trainedCompaniesLoading,
  } = useFetchCompanies('/companies/trained');

  const transactions = useFetchTransactions();
  const orders = useFetchOrders();
  const portfolio = useFetchPortfolio();
  const portfolioValues = useFetchPortfolioValues();

  if (trainedCompaniesLoading) {
    return <LoadingAnimation/>;
  }

  if (trainedCompaniesError) {
    return <div>Error fetching companies: {trainedCompaniesError}</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
        <div style={{ display: 'flex', flex: 1, gap: '20px' }}>
            {/* LEFT COLUMN (flexible width) */}
            <div
                style={{
                flex: 1,
                padding: '1rem',
                // borderRight: '1px solid #ccc',
                }}
            >
                <Portfolio portfolio={portfolio} portfolioValues={portfolioValues} trainedCompanies={trainedCompanies} transactions={transactions} />
            </div>

            {/* RIGHT COLUMN */}
            <div
              style={{
                width: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1rem',
              }}
            >
                <ContentSwitch currentView={view} onSwitchView={setView} />

                {view === 'orders' && orders && orders.length > 0 && (
                  <Orders orders={orders} />
                )}

                {view === 'transactions' && transactions && transactions.length > 0 && (
                  <Transactions transactions={transactions} />
                )}
            </div>
        </div>
    </div>
  );
}

export default App;
