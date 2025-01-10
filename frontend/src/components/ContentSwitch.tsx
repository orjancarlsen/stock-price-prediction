import React from 'react';

interface ContentSwitchProps {
    currentView: 'orders' | 'transactions';
    onSwitchView: (view: 'orders' | 'transactions') => void;
}

const ContentSwitch: React.FC<ContentSwitchProps> = ({ currentView, onSwitchView }) => {
    return (
        <div
            style={{
                display: 'flex',
                borderBottom: '1px solid #000000',
                width: 'fit-content', // or a fixed width if you prefer
            }}
        >
            {/* Transactions */}
            <button
                onClick={() => onSwitchView('transactions')}
                style={{
                    flex: 1,
                    border: 'none',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: currentView === 'transactions' ? '#000000' : '#888888',
                    outline: 'none',
                    borderBottom: currentView === 'transactions' ? '2px solid #000000' : 'none',
                    fontWeight: currentView === 'transactions' ? 'bold' : 'normal',
                }}
            >
                Transaksjoner
            </button>

            {/* Orders */}
            <button
                onClick={() => onSwitchView('orders')}
                style={{
                    flex: 1,
                    border: 'none',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: currentView === 'orders' ? '#000000' : '#888888',
                    outline: 'none',
                    borderBottom: currentView === 'orders' ? '2px solid #000000' : 'none',
                    fontWeight: currentView === 'orders' ? 'bold' : 'normal',
                }}
            >
                Ordre
            </button>
        </div>
    );
};

export default ContentSwitch;
