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
        borderRadius: '4px',
        border: '1px solid #007bff',
        overflow: 'hidden',
        width: 'fit-content', // or a fixed width if you prefer
      }}
    >
      {/* Left side: Transactions */}
      <button
        onClick={() => onSwitchView('transactions')}
        style={{
          flex: 1,
          border: 'none',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          backgroundColor: currentView === 'transactions' ? '#007bff' : 'transparent',
          color: currentView === 'transactions' ? '#fff' : '#007bff',
          outline: 'none',
        }}
      >
        Transaksjoner
      </button>

      {/* Right side: Orders */}
      <button
        onClick={() => onSwitchView('orders')}
        style={{
          flex: 1,
          border: 'none',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          backgroundColor: currentView === 'orders' ? '#007bff' : 'transparent',
          color: currentView === 'orders' ? '#fff' : '#007bff',
          outline: 'none',
        }}
      >
        Ordre
      </button>
    </div>
  );
};

export default ContentSwitch;
