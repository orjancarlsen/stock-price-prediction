import React from 'react';
import { Transaction, IconSVGType } from '../../types';
import { IconSVG } from './../IconSVG';
import { formatSingleDecimal } from '../../utils';

interface StockTransactionProps {
    transaction: Transaction;
}

/**
 * Displays a transaction row for BUY, SELL, or DIVIDEND, i.e. transactions with stock-related fields.
 */
const StockTransaction: React.FC<StockTransactionProps> = ({ transaction }) => {
    const formattedPrice = `${transaction.price_per_share?.toLocaleString()} NOK`

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
            <div style={{ padding: '8px', textAlign: 'center', marginRight: '10px' }}>
                <IconSVG
                    icon={transaction.transaction_type as IconSVGType}
                    width={28}
                    height={28}
                />
                <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                    {transaction.transaction_type}
                </div>
            </div>

            <div
                style={{
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '0.9rem',
                    gap: '8px',
                    marginRight: '10px',
                }}
            >
                <div>
                        {transaction.stock_symbol}
                </div>
                <div>
                        {formattedAmount}
                </div>
            </div>
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
        </tr>
    );
};

export default StockTransaction;
