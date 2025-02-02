import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@assets/bull.png';
import TypingFieldDropdown from './TypingFieldDropdown';
import { Company } from '../types';
import './Header.css';

interface HeaderProps {
    trainedCompanies: Company[];
}

const Header: React.FC<HeaderProps> = ({
    trainedCompanies
}) => {
    const navigate = useNavigate();

    const [searchActive, setSearchActive] = useState(false);

    const handleCompanySelect = (companyTicker: string) => {
        navigate(`/${companyTicker}`); // Navigate to the dynamic company page
        setSearchActive(false);
    };

    const handleLogoClick = () => {
        navigate('/');
    };

    return (
        <header style={headerStyle}>
            <div style={wrapperStyle}>
                <div className="clickable" style={leftContainerStyle} onClick={handleLogoClick}>
                    <img src={logo} alt="" style={imageStyle} />
                    <h1 style={titleStyle}>Aksjeprediktoren</h1>
                </div>

                <div style={rightContainerStyle}>
                    {/* Clicking the area when not expanded will activate it */}
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

export default Header;
