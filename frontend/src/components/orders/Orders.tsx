import React from 'react';
import { Order, IconSVGType } from '../../types';
import { IconSVG } from './../IconSVG';
import SingleOrder from './SingleOrder';
import PageFlipper from '../PageFlipper';

/** Helper to get a date string in YYYY-MM-DD format */
function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Format a Date for Norwegian display */
function formatNorwegianDate(date: Date): string {
  return date.toLocaleDateString('no-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** 
 * Returns all orders sorted in descending order (newest first)
 * grouped by date. (This is essentially the same as your original function.)
 */
function getSortedOrdersDesc(orders: Order[]): Order[] {
  // First group orders by date:
  const grouped = orders.reduce<Record<string, Order[]>>((acc, order) => {
    const dateKey = getDateString(new Date(order.timestamp_created));
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(order);
    return acc;
  }, {});
  // Sort dates descending:
  const sortedDateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  // Flatten the groups (each day’s orders sorted by time descending)
  const flattened: Order[] = [];
  for (const dateKey of sortedDateKeys) {
    const dayOrders = grouped[dateKey]
      .slice()
      .sort((a, b) => new Date(b.timestamp_created).getTime() - new Date(a.timestamp_created).getTime());
    flattened.push(...dayOrders);
  }
  return flattened;
}

/**
 * Paginate the sorted orders based on the available container height.
 *
 * Instead of using a fixed PER_PAGE value computed from the full list,
 * we “pack” orders into pages until adding one more order (plus its header if needed)
 * would exceed the available space.
 *
 * @param orders The orders to paginate (assumed to be sorted)
 * @param containerHeight The available vertical space in pixels
 * @returns An array of pages, where each page is an array of orders
 */
function paginateOrders(orders: Order[], containerHeight: number): Order[][] {
  const pages: Order[][] = [];
  // These heights are taken from your original calculations:
  const dateRowHeight = 48;
  const orderRowHeight = 66.4 + 12; // order row plus spacer

  let i = 0;
  while (i < orders.length) {
    let currentHeight = 0;
    const pageOrders: Order[] = [];
    let lastDate: string | null = null; // used to decide if we need a header

    // Pack as many orders as will fit in the containerHeight:
    while (i < orders.length) {
      const order = orders[i];
      const orderDate = getDateString(new Date(order.timestamp_created));
      // If this order’s date differs from the previous one in this page,
      // we need to add the date header.
      const headerHeight = orderDate !== lastDate ? dateRowHeight : 0;
      // Check if adding header (if needed) + order row fits:
      if (currentHeight + headerHeight + orderRowHeight <= containerHeight) {
        currentHeight += headerHeight + orderRowHeight;
        pageOrders.push(order);
        lastDate = orderDate;
        i++;
      } else {
        break;
      }
    }
    pages.push(pageOrders);
  }
  return pages;
}

interface OrderProps {
  orders: Order[];
}

const Orders: React.FC<OrderProps> = ({ orders }) => {
  // Get all orders sorted descending by date/time
  const sortedOrders = getSortedOrdersDesc(orders);

  // Instead of computing a fixed PER_PAGE, pre-paginate the orders.
  const containerHeight = 510;
  const paginatedOrders = paginateOrders(sortedOrders, containerHeight);

  // Pagination state
  const [page, setPage] = React.useState(0);
  const totalPages = paginatedOrders.length;
  const currentPageOrders = paginatedOrders[page] || [];

  // When rendering the current page, we want to display a date header
  // only when the date changes within this page.
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
      {/* Orders container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {currentPageOrders.map((order) => {
              const orderDate = getDateString(new Date(order.timestamp_created));
              const dateObject = new Date(order.timestamp_created);
              const displayDate = formatNorwegianDate(dateObject);
              // Only render a header if this order’s date is new for this page.
              const showHeader = orderDate !== lastRenderedDate;
              lastRenderedDate = orderDate;
              return (
                <React.Fragment key={order.id}>
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
                  <SingleOrder order={order} />
                  <tr style={{ height: '12px' }}>
                    <td colSpan={5} />
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <PageFlipper
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default Orders;
