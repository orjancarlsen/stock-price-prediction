import React, { useState, useRef, useEffect } from 'react';

function TypingFieldDropdown({ options, value, onChange, placeholder }) {
    const [filterText, setFilterText] = useState(''); // State to manage the input text
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State to manage dropdown visibility
    const dropdownRef = useRef(null); // Ref to manage clicks outside

    // Filter options based on the input text (case-insensitive)
    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(filterText.toLowerCase()) ||
        option.symbol.toLowerCase().includes(filterText.toLowerCase())
    );

    const handleInputChange = (e) => {
        setFilterText(e.target.value);
        if (!isDropdownOpen) {
            setIsDropdownOpen(true); // Open dropdown when typing starts
        }
    };

    const handleOptionClick = (option) => {
        setFilterText(`${option.name} (${option.symbol})`); // Set clicked value in input
        onChange({ target: { value: option.symbol } }); // Update value
        setIsDropdownOpen(false); // Close dropdown after selection
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false); // Close dropdown if clicked outside
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
            {/* Input field for typing */}
            <input
                type="text"
                placeholder={placeholder}
                value={filterText}
                onChange={handleInputChange}
                onFocus={() => setIsDropdownOpen(true)} // Open dropdown on focus
                style={{ width: '100%' }} // Basic styling
            />

            {/* Dropdown menu */}
            {isDropdownOpen && (
                <ul
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        background: 'white',
                        border: '1px solid #ccc',
                        margin: 0,
                        padding: 0,
                        listStyle: 'none',
                        zIndex: 1000,
                        width: '100%',
                    }}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <li
                                key={index}
                                onClick={() => handleOptionClick(option)}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #eee',
                                }}
                                onMouseDown={(e) => e.preventDefault()} // Prevent losing focus on click
                            >
                                {option.name} ({option.symbol})
                            </li>
                        ))
                    ) : (
                        <li style={{ padding: '8px', color: '#999' }}>No options found</li>
                    )}
                </ul>
            )}
        </div>
    );
}

export default TypingFieldDropdown;