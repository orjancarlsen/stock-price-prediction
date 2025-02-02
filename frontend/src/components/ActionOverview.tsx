import React, { useState } from 'react';
import Transactions from './transactions/Transactions';
import Orders from './orders/Orders';
import ContentSwitch from './ContentSwitch';
import { Transaction, Order } from '../types';

interface ActionOverviewProps {
  transactions: Transaction[];
  orders: Order[];
}

const ActionOverview: React.FC<ActionOverviewProps> = ({
  transactions,
  orders,
}) => {
  const [view, setView] = useState<'orders' | 'transactions'>('transactions');

  return (
    <div
      style={{
        flex: 1,
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '600px',
      }}
    >
      <ContentSwitch currentView={view} onSwitchView={setView} />

      {view === 'orders' && orders && orders.length > 0 && (
        <Orders orders={orders} />
      )}

      {view === 'transactions' && transactions && transactions.length > 0 && (
        <Transactions transactions={transactions} />
      )}
    </div>
  );
};

export default ActionOverview;
