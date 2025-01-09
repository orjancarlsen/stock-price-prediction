import React, { useState, ChangeEvent } from 'react';
import Graph from './components/GradientGraph';
import TypingFieldDropdown from './components/TypingFieldDropdown';
import Transactions from './components/transactions/Transactions';
import { useFetchCompanies } from './hooks/useFetchCompanies';
import { useFetchPrices } from './hooks/useFetchPrices';
import { useFetchTransactions } from './hooks/useFetchTransactions';

function App() {
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  const { 
    companies: trainedCompanies, 
    error: trainedCompaniesError,
    loading: trainedCompaniesLoading 
  } = useFetchCompanies('/companies/trained');

  const {
    data: historicCompanyPrices,
    loading: pricesLoading,
    error: pricesError
  } = useFetchPrices(selectedCompany, '2023-01-01', '2023-12-31');

  const transactions = useFetchTransactions();
  console.log("Transactions:", transactions);

  const handleCompanyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompany(e.target.value);
    console.log("Selected company:", e.target.value);
  };

  if (trainedCompaniesLoading) {
    return <div>Loading...</div>;
  }

  if (trainedCompaniesError) {
    return <div>Error fetching companies: {trainedCompaniesError}</div>;
  }

  return (
    <div>
      <h1>Trained Models</h1>
      <TypingFieldDropdown 
        options={trainedCompanies} 
        value={selectedCompany} 
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleCompanyChange(e as unknown as ChangeEvent<HTMLSelectElement>)}
        placeholder="Select model" 
      />

      {transactions && transactions.length > 0 && (
        <Transactions transactions={transactions} />
      )}

      {selectedCompany && historicCompanyPrices.dates.length > 0 && (
        <Graph selectedCompany={selectedCompany} historicCompanyPrices={historicCompanyPrices} />
      )}
    </div>
  );
}

export default App;
