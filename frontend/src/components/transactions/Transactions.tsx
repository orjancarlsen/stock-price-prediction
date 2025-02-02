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
    const dateKey = getDateString(new Date(transaction.timestamp));
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
    const dayTxs = grouped[dateKey]
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    flattened.push(...dayTxs);
  }
  return flattened;
}

/**
 * Paginate transactions to pack as many as will fit within containerHeight.
 *
 * For each transaction we add the transaction row height plus, if needed,
 * the date header height (if the transaction’s date is different from the
 * previous transaction on the same page).
 */
function paginateTransactions(transactions: Transaction[], containerHeight: number): Transaction[][] {
  const pages: Transaction[][] = [];
  const dateRowHeight = 48;              // height for the date header
  const transactionRowHeight = 66.4 + 12;  // transaction row + spacer row

  let i = 0;
  while (i < transactions.length) {
    let currentHeight = 0;
    const pageTransactions: Transaction[] = [];
    let lastDate: string | null = null;

    // Pack transactions into the current page until adding the next one would overflow.
    while (i < transactions.length) {
      const transaction = transactions[i];
      const transactionDate = getDateString(new Date(transaction.timestamp));
      // If the date changes, we need to account for the header height.
      const headerHeight = transactionDate !== lastDate ? dateRowHeight : 0;

      if (currentHeight + headerHeight + transactionRowHeight <= containerHeight) {
        currentHeight += headerHeight + transactionRowHeight;
        pageTransactions.push(transaction);
        lastDate = transactionDate;
        i++;
      } else {
        break;
      }
    }
    pages.push(pageTransactions);
  }
  return pages;
}

interface TransactionsProps {
  transactions: Transaction[];
}

const Transactions: React.FC<TransactionsProps> = ({ transactions }) => {
  // Get all transactions sorted descending by date/time
  const sortedTransactions = getSortedTransactionsDesc(transactions);

  // Pre-paginate transactions based on available vertical space (510px)
  const containerHeight = 510;
  const paginatedTransactions = paginateTransactions(sortedTransactions, containerHeight);

  // Pagination state
  const [page, setPage] = React.useState(0);
  const totalPages = paginatedTransactions.length;
  const currentPageTransactions = paginatedTransactions[page] || [];

  // Render the current page, adding date headers only when the date changes within the page.
  let lastRenderedDate = '';

  return (
    <div
      style={{
        width: '380px',
        height: '540px',
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
            {currentPageTransactions.map((transaction) => {
              const transactionDate = getDateString(new Date(transaction.timestamp));
              const dateObject = new Date(transaction.timestamp);
              const displayDate = formatNorwegianDate(dateObject);
              const showHeader = transactionDate !== lastRenderedDate;
              lastRenderedDate = transactionDate;

              const isStockTransaction = ['BUY', 'SELL', 'DIVIDEND'].includes(transaction.transaction_type);

              return (
                <React.Fragment key={transaction.id}>
                  {showHeader && (
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
                  )}
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
          </tbody>
        </table>
      </div>

      <PageFlipper currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default Transactions;
