import React, {useState} from 'react';
import GradientLineChart from './GradientLineChart';
import Graph from './graph';
import Dropdown from './components/Dropdown';

import { useFetchCompanies } from './hooks/useFetchCompanies';



function App() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const { companies, error, loading } = useFetchCompanies('http://localhost:5000/trained_models');

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
    console.log("Selected company:", e.target.value);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching companies: {error}</div>;
  }

  return (
    <div>
      <h1>Company Selector</h1>
      <Dropdown 
        options={companies} 
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
