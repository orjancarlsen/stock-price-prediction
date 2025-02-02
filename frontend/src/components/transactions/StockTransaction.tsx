import React from 'react';
import { Transaction, IconSVGType } from '../../types';
import { IconSVG } from './../IconSVG';
import { formatSingleDecimal } from '../../utils';
import { transactionTypeMap } from '../../utils';

interface StockTransactionProps {
  transaction: Transaction;
}

/**
 * Displays a transaction row for BUY, SELL, or DIVIDEND, i.e. transactions with stock-related fields.
 */
const StockTransaction: React.FC<StockTransactionProps> = ({ transaction }) => {
  const formattedPrice = `${transaction.price_per_share?.toLocaleString()} NOK`;
  const formattedAmount = formatSingleDecimal(transaction.amount);

  // Use the gridTemplateColumns string for the desired three-column layout.
  const gridTemplateColumns = "50px 1fr 140px";

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: gridTemplateColumns,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ccc',
        borderRadius: '8px',
      }}
    >
      {/* Column 1: Icon and Transaction Type */}
      <div style={{ padding: '4px', textAlign: 'center' }}>
        <IconSVG
          icon={transaction.transaction_type as IconSVGType}
          width={28}
          height={28}
        />
        <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>
          {transactionTypeMap[transaction.transaction_type]}
        </div>
      </div>

      {/* Column 2: Transaction Name and Amount */}
      <div
        style={{
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '0.9rem',
          gap: '8px',
        }}
      >
        <div>
          {transaction.name}
        </div>
        <div>{formattedAmount}</div>
      </div>

      {/* Column 3: Number of Shares and Price */}
      <div
        style={{
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '0.9rem',
          gap: '8px',
        }}
      >
        <div>
          <span style={{ minWidth: '48px', display: 'inline-block' }}>
            Antall:
          </span>
          {transaction.number_of_shares}
        </div>
        <div>
          <span style={{ minWidth: '48px', display: 'inline-block' }}>
            Pris:
          </span>
          {formattedPrice}
        </div>
      </div>
    </div>
  );
};

export default StockTransaction;
