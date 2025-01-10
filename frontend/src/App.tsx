import React, { useState, ChangeEvent } from 'react';
import Graph from './components/GradientGraph';
import TypingFieldDropdown from './components/TypingFieldDropdown';
import Transactions from './components/transactions/Transactions';
import Orders from './components/orders/Orders';
import { useFetchCompanies } from './hooks/useFetchCompanies';
import { useFetchPrices } from './hooks/useFetchPrices';
import { useFetchTransactions } from './hooks/useFetchTransactions';
import { useFetchOrders } from './hooks/useFetchOrders';
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* LEFT COLUMN (flexible width) */}
      <div
        style={{
          flex: 1,
          padding: '1rem',
          borderRight: '1px solid #ccc',
        }}
      >
        <h1>Trained Models</h1>

        <TypingFieldDropdown
          options={trainedCompanies}
          value={selectedCompany}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleCompanyChange(e as unknown as ChangeEvent<HTMLSelectElement>)
          }
          placeholder="Select model"
        />

        {/* Graph (only if there’s valid data) */}
        {selectedCompany && historicCompanyPrices?.dates?.length > 0 && (
          <Graph selectedCompany={selectedCompany} historicCompanyPrices={historicCompanyPrices} />
        )}
      </div>

      {/* RIGHT COLUMN (fixed width: 500px) */}
      <div
        style={{
          width: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem',
        }}
      >
        {/* Content Switch (Orders / Transactions) */}
        <ContentSwitch currentView={view} onSwitchView={setView} />

        {/* Conditionally render Orders or Transactions, also centered */}
        {view === 'orders' && orders && orders.length > 0 && (
          <div style={{ marginTop: '0rem' }}>
            <Orders orders={orders} />
          </div>
        )}

        {view === 'transactions' && transactions && transactions.length > 0 && (
          <div style={{ marginTop: '0rem' }}>
            <Transactions transactions={transactions} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
