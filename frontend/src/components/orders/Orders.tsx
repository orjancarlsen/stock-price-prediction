import React from 'react';
import { Order, IconSVGType } from '../../types';
import { IconSVG } from './../IconSVG';
import SingleOrder from './SingleOrder';
import PageFlipper from '../PageFlipper';

function getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

function groupOrdersByDate(orders: Order[]) {
  return orders.reduce<Record<string, Order[]>>((acc, order) => {
    const dateKey = getDateString(new Date(order.timestamp_created  + ' GMT+0100'));
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(order);
    return acc;
  }, {});
}

function formatNorwegianDate(date: Date): string {
    return date.toLocaleDateString('no-NO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function getSortedOrdersDesc(orders: Order[]): Order[] {
  const grouped = groupOrdersByDate(orders);
  const sortedDateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const flattened: Order[] = [];
  for (const dateKey of sortedDateKeys) {
    // Sort each day's transactions by timestamp descending
    const dayTxs = grouped[dateKey].slice().sort((a, b) =>
      new Date(b.timestamp_created).getTime() - new Date(a.timestamp_created).getTime()
    );
    flattened.push(...dayTxs);
  }

  return flattened;
}

interface OrderProps {
    orders: Order[];
}

const Orders: React.FC<OrderProps> = ({ orders }) => {
    // Flatten + sort all orders by date/time descending
    const sortedOrders = getSortedOrdersDesc(orders);

    // Pagination state
    const PER_PAGE = 4;
    const [page, setPage] = React.useState(0);
    const totalPages = Math.ceil(sortedOrders.length / PER_PAGE);

    // The slice of orders for the current page
    const startIndex = page * PER_PAGE;
    const endIndex = startIndex + PER_PAGE;
    const currentSlice = sortedOrders.slice(startIndex, endIndex);

    // Group the sliced orders by date (again) for display
    const groupedForDisplay = groupOrdersByDate(currentSlice);
    const groupedDateKeys = Object.keys(groupedForDisplay).sort((a, b) => b.localeCompare(a));

    return (
        <div
            style={{
                width: '380px',
                height: '464px',
                display: 'flex',
                flexDirection: 'column',
                margin: '1rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
            }}
        >
            {/* Scrollable area for orders */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        {groupedDateKeys.map((dateKey) => {
                            // Convert back to Date for display
                            const [year, month, day] = dateKey.split('-');
                            const dateObject = new Date(+year, +month - 1, +day);
                            const displayDate = formatNorwegianDate(dateObject);

                            const dateOrders = groupedForDisplay[dateKey];

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

                                {/* Orders for this date */}
                                {dateOrders.map((order) => {
                                    return (
                                        <React.Fragment key={order.id}>
                                            <SingleOrder order={order} />
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

export default Orders;