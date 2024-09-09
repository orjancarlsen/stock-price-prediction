import React from 'react';

function Dropdown({ options, value, onChange, placeholder }) {
  return (
    <select value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {options.map((option, index) => (
        <option key={index} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export default Dropdown;
