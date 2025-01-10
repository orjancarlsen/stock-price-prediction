import React from "react";
import { Order, IconSVGType } from "../../types";
import { formatSingleDecimal } from './Orders';
import { IconSVG } from './../IconSVG';

interface SingleOrderProps {
    order: Order;
}

const SingleOrder: React.FC<SingleOrderProps> = ({ order }) => {
    const formattedAmount = formatSingleDecimal(order.amount);
    const formattedPrice = `${order.price_per_share.toLocaleString()} NOK`

    return (
        <div
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
                    icon={order.status as IconSVGType}
                    width={28}
                    height={28}
                />
                    <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                    {order.status}
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
                <div>{order.stock_symbol}</div>
                <div>{formattedAmount}</div>
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
                    {order.number_of_shares}
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

export default SingleOrder;