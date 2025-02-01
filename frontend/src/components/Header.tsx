// src/components/Header.tsx
import React, { useState } from 'react';
import logo from '@assets/bull.png';
import TypingFieldDropdown from './TypingFieldDropdown';
import { Company } from '../types';

interface HeaderProps {
    trainedCompanies: Company[];
}

const Header: React.FC<HeaderProps> = ({
    trainedCompanies
}) => {
  const [searchActive, setSearchActive] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCompany(e.target.value);
  };

  return (
    <header style={headerStyle}>
      <div style={wrapperStyle}>
        {/* Left side: Logo and Title */}
        <div style={leftContainerStyle}>
          <img src={logo} alt="Logo" style={imageStyle} />
          <h1 style={titleStyle}>Stock Price Prediction</h1>
        </div>

        {/* Right side: Always render TypingFieldDropdown */}
        <div style={rightContainerStyle}>
          {/* Clicking the area when not expanded will activate it */}
          <div onClick={() => !searchActive && setSearchActive(true)}>
            <TypingFieldDropdown
              options={trainedCompanies}
              onChange={handleInputChange}
              placeholder="Søk etter selskap"
              expanded={searchActive}
              onClose={() => setSearchActive(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

const headerStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#000000',
  padding: '1rem',
  boxSizing: 'border-box',
};

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const leftContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const rightContainerStyle: React.CSSProperties = {
  minWidth: '20px', // Must be at least as wide as the collapsed field
};

const imageStyle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  marginRight: '1rem',
};

const titleStyle: React.CSSProperties = {
  color: '#fff',
  margin: 0,
  textAlign: 'left',
};

export default Header;
