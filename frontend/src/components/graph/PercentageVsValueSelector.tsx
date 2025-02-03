import React, { useState } from 'react';
import './PercentageVsValueSelector.css';

interface PercentageVsValueSelectorProps {
    defaultValue: 'value' | 'percentage';
    onChange: (value: 'value' | 'percentage') => void;
}

const PercentageVsValueSelector: React.FC<PercentageVsValueSelectorProps> = ({
    defaultValue,
    onChange
}) => {
    const [selected, setSelected] = useState<'value' | 'percentage'>(defaultValue);

    const handleClick = (value: 'value' | 'percentage') => {
        if (value !== selected) {
            setSelected(value);
            onChange(value);
        }
    };

    return (
        <div className={`toggle-container`}>
            <div
                className="toggle-indicator"
                style={{ transform: selected === 'value' ? 'translateX(0%)' : 'translateX(100%)' }}
            />
            <div
                className="toggle-option"
                onClick={() => handleClick(selected === 'value' ? 'percentage' : 'value')}
            >
                $
            </div>
            <div
                className="toggle-option"
                onClick={() => handleClick(selected === 'percentage' ? 'value' : 'percentage')}
            >
                %
            </div>
        </div>
    );
};

export default PercentageVsValueSelector;
