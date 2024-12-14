import React, {useState} from 'react';
import Graph from './graph';
import TypingFieldDropdown from './components/TypingFieldDropdown';

import { useFetchCompanies } from './hooks/useFetchCompanies';



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

      {/* <Graph selectedCompany={selectedCompany} /> */}
      <Graph />
    </div>
  );
}

export default App;
