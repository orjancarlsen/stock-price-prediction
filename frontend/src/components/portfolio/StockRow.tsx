import React from 'react';
import { Asset } from '../../types';
import { formatSingleDecimal } from '../../utils';

interface StockRowProps {
    asset: Asset;
}

const StockRow: React.FC<StockRowProps> = ({ asset }) => {
    const formattedValue = formatSingleDecimal(asset.total_value);
    const formattedPrice = `${asset.price_per_share?.toLocaleString()} NOK`
    const formattedTodaysValue = `${asset.todays_value?.toLocaleString()} NOK`
    const profit = asset.todays_value !== undefined && asset.price_per_share !== undefined && asset.number_of_shares !== undefined
        ? (asset.todays_value - asset.price_per_share ) / asset.price_per_share
        : 0;
    const formattedProfit = (profit * 100).toFixed(2);

    return (
        <div
            style={{
            padding: '8px',
            backgroundColor: '#f9f9f9',
            display: 'flex',
            flexDirection: 'row',
            fontSize: '0.9rem',
            gap: '8px',
            height: '24px', // Reserve a fixed number of pixels for each row
            alignItems: 'center' // Center items vertically
            }}
        >
            <div style={{ textAlign: 'left', alignItems: 'center', display: 'flex', width: '80px' }}>
                {asset.stock_symbol}
            </div>
            <div style={{ textAlign: 'right', width: '80px' }}>
                <div> {formattedValue} </div>
            </div>
            <div style={{ textAlign: 'right', width: '50px' }}>
                <div> {asset.number_of_shares} </div>
            </div>
            <div style={{ textAlign: 'right', width: '80px' }}>
                <div> {formattedPrice} </div>
            </div>
            <div style={{ textAlign: 'right', width: '80px' }}>
                <div> {formattedTodaysValue} </div>
            </div>
            <div style={{ textAlign: 'right', width: '80px', color: profit >= 0 ? 'green' : 'red' }}>
                <div> {formattedProfit}% </div>
            </div>
        </div>
    );
};

export default StockRow;