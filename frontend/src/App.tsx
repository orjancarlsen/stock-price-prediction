import React, { useState, ChangeEvent } from 'react';
import Graph from './components/GradientGraph';
import TypingFieldDropdown from './components/TypingFieldDropdown';
import Transactions from './components/transactions/Transactions';
import Orders from './components/orders/Orders';
import Portfolio from './components/portfolio/Portfolio';
import { useFetchCompanies } from './hooks/useFetchCompanies';
import { useFetchPrices } from './hooks/useFetchPrices';
import { useFetchTransactions } from './hooks/useFetchTransactions';
import { useFetchOrders } from './hooks/useFetchOrders';
import { useFetchPortfolio } from './hooks/useFetchPortfolio';
import { useFetchPortfolioValues } from './hooks/useFetchPortfolioValues';
import ContentSwitch from './components/ContentSwitch';

function App() {
  const [view, setView] = useState<'orders' | 'transactions'>('transactions');
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  // Fetch calls
  const {
    companies: trainedCompanies,
    error: trainedCompaniesError,
    loading: trainedCompaniesLoading,
  } = useFetchCompanies('/companies/trained');

  const {
    data: historicCompanyPrices,
    loading: pricesLoading,
    error: pricesError,
  } = useFetchPrices(selectedCompany, '2023-01-01', '2023-12-31');

  const transactions = useFetchTransactions();
  const orders = useFetchOrders();
  const portfolio = useFetchPortfolio();
  const portfolioValues = useFetchPortfolioValues();

  const handleCompanyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompany(e.target.value);
  };

  if (trainedCompaniesLoading) {
    return <div>Loading...</div>;
  }

  if (trainedCompaniesError) {
    return <div>Error fetching companies: {trainedCompaniesError}</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flex: 1 }}>
            {/* LEFT COLUMN (flexible width) */}
            <div
                style={{
                flex: 1,
                padding: '1rem',
                // borderRight: '1px solid #ccc',
                }}
            >
                <Portfolio portfolio={portfolio} portfolioValues={portfolioValues} />
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

        <TypingFieldDropdown
            options={trainedCompanies}
            value={selectedCompany}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleCompanyChange(e as unknown as ChangeEvent<HTMLSelectElement>)
            }
            placeholder="Select model"
        />

        {historicCompanyPrices?.dates?.length > 0 && (
            <Graph historicCompanyPrices={historicCompanyPrices} />
        )}
    </div>
  );
}

export default App;
