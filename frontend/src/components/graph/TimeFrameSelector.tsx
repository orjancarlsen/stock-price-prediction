import React, { useState } from 'react';
import { TimeFrame } from 'src/types';

interface TimeFrameSelectorProps {
    onChange: (timeFrame: TimeFrame) => void;
    profitsMap: { [key in TimeFrame]: number };
    defaultTimeFrame?: TimeFrame;
}

const TimeFrameSelector: React.FC<TimeFrameSelectorProps> = ({ onChange, profitsMap, defaultTimeFrame = 'max'  }) => {
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>(defaultTimeFrame);
    const timeFrames: TimeFrame[] = ['1w', '1m', '3m', '1y', 'max'];

    const handleClick = (timeFrame: TimeFrame) => {
        setSelectedTimeFrame(timeFrame);
        onChange(timeFrame);
    };

    return (
        <div style={{ display: 'flex', gap: '0px', marginBottom: '4px' }}>
            {timeFrames.map((tf) => {
                const profit = profitsMap[tf] ?? 0;
                const displayProfit = profit.toFixed(2) + '%';
                return (
                    <div 
                        key={tf}
                        onClick={() => handleClick(tf)} 
                        style={{
                            borderColor: selectedTimeFrame === tf ? 'lightgrey' : 'transparent',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderRadius: '5px',
                            marginRight: '10px'
                        }}
                    >
                        <button
                            style={{
                                backgroundColor: 'transparent',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '5px',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <span>{tf}</span>
                            <span style={{ fontSize: '0.85rem', color: profit >= 0 ? 'green' : 'red' }}>{displayProfit}</span>
                        </button>
                    </div>
                )
            })}
        </div>
    );
};

export default TimeFrameSelector;
