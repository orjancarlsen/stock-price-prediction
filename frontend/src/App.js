import React, {useState} from 'react';
import Graph from './graph';
import TypingFieldDropdown from './components/TypingFieldDropdown';
import { useFetchCompanies } from './hooks/useFetchCompanies';
import useFetchPrices from './hooks/useFetchPrices';

function App() {
  const [selectedCompany, setSelectedCompany] = useState('');

  const { 
    companies: trainedCompanies, 
    error: trainedCompaniesError,
    loading: trainedCompaniesLoading 
  } = useFetchCompanies('/companies/trained');

  const { 
    companies: availableCompanies,
    error: availableCompaniesError,
    loading: availableCompaniesLoading 
  } = useFetchCompanies('/companies/available');

  const {
    data: historicCompanyPrices,
    loading: pricesLoading,
    error: pricesError
  } = useFetchPrices(selectedCompany, '2023-01-01', '2023-12-31');

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
    console.log("Selected company:", e.target.value);
  };

  if (trainedCompaniesLoading || availableCompaniesLoading) {
    return <div>Loading...</div>;
  }

  if (trainedCompaniesError || availableCompaniesError) {
    return <div>Error fetching companies: {trainedCompaniesError}</div>;
  }

  return (
    <div>
      <h1>Trained Models</h1>
      <TypingFieldDropdown 
        options={trainedCompanies} 
        value={selectedCompany} 
        onChange={handleCompanyChange} 
        placeholder="Select model" 
      />

      <h1>Available Models</h1>
      <TypingFieldDropdown 
        options={availableCompanies} 
        value={selectedCompany} 
        onChange={handleCompanyChange} 
        placeholder="Select a company" 
      />

      {selectedCompany && historicCompanyPrices.dates.length > 0 && (
        <Graph selectedCompany={selectedCompany} historicCompanyPrices={historicCompanyPrices} />
      )}
    </div>
  );
}

export default App;
