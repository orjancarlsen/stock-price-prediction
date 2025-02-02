import React, { useState, useEffect, useRef } from 'react';
import ScalesIcon from '@assets/scales.svg';

interface ComparisonSelectorProps {
  onChange: (selected: string) => void;
}

const ComparisonSelector: React.FC<ComparisonSelectorProps> = ({ onChange }) => {
  const [selected, setSelected] = useState<string>('OSEBX.OL');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { index: 'OSEBX.OL', name: 'OSEBX' },
    { index: '^GSPC', name: 'S&P 500' },
    { index: '^DJI', name: 'Dow Jones Industrial Average' },
    { index: '^IXIC', name: 'NASDAQ Composite' },
    { index: '^GDAXI', name: 'DAX P' },
  ];

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleClick = (option: { index: string; name: string }) => {
    setSelected(option.index);
    onChange(option.index);
    setDropdownOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button
        onClick={toggleDropdown}
        style={{
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          padding: '5px',
          border: '1px solid lightgrey',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        <ScalesIcon width="16" height="16" />
        <span style={{ marginLeft: '4px' }}>Sammenlign</span>
      </button>
      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            minWidth: '300px',
            backgroundColor: 'white',
            border: '1px solid lightgrey',
            borderRadius: '5px',
            marginTop: '5px',
            zIndex: 1,
          }}
        >
          {options.map((option) => (
            <div
              key={option.index}
              onClick={() => handleClick(option)}
              onMouseEnter={() => setHovered(option.index)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '8px 10px',
                cursor: 'pointer',
                backgroundColor: hovered === option.index ? 'lightgrey' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* SVG circle with an optional checkmark inside */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  style={{ marginRight: '8px' }}
                >
                  <circle cx="12" cy="12" r="10" stroke="#888" strokeWidth="2" fill="none" />
                  {selected === option.index && (
                    <polyline
                      points="9 12 12 15 16 9"
                      stroke="grey"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
                <span>{option.name}</span>
              </div>
              {/* Faded index text */}
              <span style={{ color: '#888', fontSize: '0.9em' }}>{option.index}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComparisonSelector;
