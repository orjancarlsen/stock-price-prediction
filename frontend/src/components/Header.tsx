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
    <header className="header">
      <div className="header-wrapper">
        {/* Left container: Logo and main title */}
        <div className="header-left clickable" onClick={handleLogoClick}>
          <img src={logo} alt="Logo" className="header-logo" />
          <h1 className="header-title">Bull Invest</h1>
        </div>

        {/* Right container: Search field */}
        <div className="header-right">
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
        <div className={`center-name ${searchActive ? 'search-active' : ''}`}>
          <h2 className="header-title">{name}</h2>
        </div>
      )}
    </header>
  );
};

export default Header;
