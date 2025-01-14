import React from 'react';
import { Transaction, IconSVGType } from '../../types';
import { IconSVG } from './../IconSVG';
import StockTransaction from './StockTransaction';
import MoneyTransaction from './MoneyTransaction';
import PageFlipper from '../PageFlipper';

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatNorwegianDate(date: Date): string {
  return date.toLocaleDateString('no-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function groupTransactionsByDate(transactions: Transaction[]) {
  return transactions.reduce<Record<string, Transaction[]>>((acc, transaction) => {
    const dateKey = getDateString(new Date(transaction.timestamp  + ' GMT+0100'));
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {});
}

function getSortedTransactionsDesc(transactions: Transaction[]): Transaction[] {
  const grouped = groupTransactionsByDate(transactions);
  const sortedDateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const flattened: Transaction[] = [];
  for (const dateKey of sortedDateKeys) {
    // Sort each day's transactions by timestamp descending
    const dayTxs = grouped[dateKey].slice().sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    flattened.push(...dayTxs);
  }

  return flattened;
}

function getMaxTransactionsThatFit(transactions: Transaction[], containerHeight = 510): number {
  const dateRowHeight = 48;
  const transactionRowHeight = 66.4 + 12; // transaction row + spacer row

  let maxFit = 0;

  for (let i = 1; i <= transactions.length; i++) {
    // Take the first i transactions
    const slice = transactions.slice(0, i);

    // How many unique date rows in this slice?
    const grouped = groupTransactionsByDate(slice);
    const dateKeys = Object.keys(grouped);
    const d = dateKeys.length;

    // Compute total needed height
    const totalHeight = d * dateRowHeight + i * transactionRowHeight;

    // Check if we still fit within containerHeight
    if (totalHeight <= containerHeight) {
      maxFit = i;
    } else {
      break;
    }
  }

  return maxFit;
}


interface TransactionsProps {
  transactions: Transaction[];
}

const Transactions: React.FC<TransactionsProps> = ({ transactions }) => {
  // Flatten + sort all transactions by date/time descending
  const allSortedTx = getSortedTransactionsDesc(transactions);

  // Dynamically determine how many transactions fit in 510px
  const PER_PAGE = getMaxTransactionsThatFit(allSortedTx, 510);

  // Pagination state
  const [page, setPage] = React.useState(0);
  const totalPages = Math.ceil(allSortedTx.length / PER_PAGE);

  // The slice of transactions for the current page
  const startIndex = page * PER_PAGE;
  const endIndex = startIndex + PER_PAGE;
  const currentSlice = allSortedTx.slice(startIndex, endIndex);

  // Group the sliced transactions by date (again) for display
  const groupedForDisplay = groupTransactionsByDate(currentSlice);
  const groupedDateKeys = Object.keys(groupedForDisplay).sort((a, b) => b.localeCompare(a));

  // Render
  return (
    <div
      style={{
        width: '380px',
        height: '510px',
        display: 'flex',
        flexDirection: 'column',
        margin: '1rem',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}
    >
      {/* Scrollable area for transactions */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {groupedDateKeys.map((dateKey) => {
              // Convert back to Date for display
              const [year, month, day] = dateKey.split('-');
              const dateObject = new Date(+year, +month - 1, +day);
              const displayDate = formatNorwegianDate(dateObject);

              const dateTransactions = groupedForDisplay[dateKey];

              return (
                <React.Fragment key={dateKey}>
                  {/* Single date row */}
                  <tr>
                    <td
                      style={{
                        padding: '8px 0',
                        fontWeight: 'normal',
                        textAlign: 'left',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <IconSVG icon={IconSVGType.Calendar} />
                      <span style={{ marginLeft: '4px' }}>{displayDate}</span>
                    </td>
                  </tr>

                  {/* Transactions for this date */}
                  {dateTransactions.map((transaction) => {
                    const isStockTransaction = 
                      ['BUY', 'SELL', 'DIVIDEND'].includes(transaction.transaction_type);

                    return (
                      <React.Fragment key={transaction.id}>
                        {isStockTransaction ? (
                          <StockTransaction transaction={transaction} />
                        ) : (
                          <MoneyTransaction transaction={transaction} />
                        )}
                        {/* Spacer row */}
                        <tr style={{ height: '12px' }}>
                          <td colSpan={5} />
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <PageFlipper
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default Transactions;
