import React from 'react';
import { Transaction, IconSVGType } from '../../types';
import { IconSVG } from './../IconSVG';
import { formatSingleDecimal } from './Transactions';

interface MoneyTransactionProps {
  transaction: Transaction;
}

/**
 * Displays a transaction row for DEPOSIT or WITHDRAW, i.e. money-only fields.
 */
const MoneyTransaction: React.FC<MoneyTransactionProps> = ({ transaction }) => {
  const formattedAmount = formatSingleDecimal(transaction.amount);

  return (
    <tr
      style={{
        backgroundColor: '#f9f9f9',
        border: '1px solid #ccc',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <td style={{ padding: '8px', textAlign: 'center' }}>
        <IconSVG
          icon={transaction.transaction_type as IconSVGType}
          width={28}
          height={28}
        />
        <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>
          {transaction.transaction_type}
        </div>
      </td>
      <td style={{ padding: '8px' }}>{formattedAmount}</td>
    </tr>
  );
};

export default MoneyTransaction;
