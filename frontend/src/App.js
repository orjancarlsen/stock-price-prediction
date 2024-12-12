import React, {useState} from 'react';
import GradientLineChart from './GradientLineChart';
import Graph from './graph';
import Dropdown from './components/Dropdown';

import { useFetchCompanies } from './hooks/useFetchCompanies';



function App() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const { 
    companies: trainedCompanies, 
    error: trainedCompaniesError,
    loading: trainedCompaniesLoading 
  } = useFetchCompanies('http://localhost:2000/companies/trained');
  const { 
    companies: availableCompanies,
    error: availableCompaniesError,
    loading: availableCompaniesLoading 
  } = useFetchCompanies('http://localhost:2000/companies/available');

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
      <Dropdown 
        options={trainedCompanies} 
        value={selectedCompany} 
        onChange={handleCompanyChange} 
        placeholder="Select model" 
      />

      <h1>Available Models</h1>
      <Dropdown 
        options={availableCompanies} 
        value={selectedCompany} 
        onChange={handleCompanyChange} 
        placeholder="Select a company" 
      />

      {/* Display Graph Component */}
      {/* <Graph selectedCompany={selectedCompany} /> */}
      <Graph />
    </div>
  );
}

export default App;
