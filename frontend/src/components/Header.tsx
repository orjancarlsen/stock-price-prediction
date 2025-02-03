import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@assets/bull.png';
import TypingFieldDropdown from './TypingFieldDropdown';
import { Company } from '../types';
import './Header.css';

interface HeaderProps {
  trainedCompanies: Company[];
  name?: string;
}

const Header: React.FC<HeaderProps> = ({ trainedCompanies, name }) => {
  const navigate = useNavigate();
  const [searchActive, setSearchActive] = useState(false);

  const handleCompanySelect = (companyTicker: string) => {
    navigate(`/${companyTicker}`);
    setSearchActive(false);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header style={headerStyle}>
      <div style={wrapperStyle}>
        {/* Left container: Logo and main title */}
        <div className="clickable" style={leftContainerStyle} onClick={handleLogoClick}>
          <img src={logo} alt="Logo" style={imageStyle} />
          <h1 style={titleStyle}>Bull Invest</h1>
        </div>

        {/* Right container: Search field */}
        <div style={rightContainerStyle}>
          <div onClick={() => !searchActive && setSearchActive(true)}>
            <TypingFieldDropdown
              options={trainedCompanies}
              onSelect={(ticker) => handleCompanySelect(ticker)}
              placeholder="Søk etter selskap"
              expanded={searchActive}
              onClose={() => setSearchActive(false)}
            />
          </div>
        </div>
      </div>

      {/* Centered name: absolutely positioned in the middle of the header */}
      {name && (
        <div style={centerNameStyle}>
          <h2 style={titleStyle}>{name}</h2>
        </div>
      )}
    </header>
  );
};

const headerStyle: React.CSSProperties = {
  position: 'relative', // Make header the positioning context
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
  minWidth: '0px', // Must be at least as wide as the collapsed field
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

const centerNameStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)', // Center horizontally and vertically within the header
  textAlign: 'center',
};

const nameStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '1.2rem',
};

export default Header;
