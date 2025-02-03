import React, { useMemo } from 'react';
import { Asset, AssetType } from '../../types';
import StockRow from './StockRow';
import PieChart from './PieChart';

interface PortfolioOverviewProps {
    portfolio: Asset[];
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
    portfolio,
}) => {    
    const pieChartData = portfolio.map(asset => {
        if (asset.asset_type === AssetType.CASH) {
            return { name: 'Saldo', value: asset.total_value };
        } else if (asset.asset_type === AssetType.STOCK) {
            return { name: asset.name || 'Unknown', value: (asset.todays_value ?? 0) * (asset.number_of_shares ?? 0) };
        }
        return { name: 'Unknown', value: 0 };
    });

  // Function to Calculate Avkastning (Return)
    const calculateAvkastning = (asset: Asset): number => {
        if (
            asset.todays_value !== undefined &&
            asset.price_per_share !== undefined &&
            asset.number_of_shares !== undefined &&
            asset.price_per_share !== 0
        ) {
            return (asset.todays_value - asset.price_per_share) / asset.price_per_share;
        }
            return 0;
    };

    // Memoized Sorted Stocks by Avkastning Descending
    const sortedStocks = useMemo(() => {
        return portfolio
            .filter((asset) => asset.asset_type === AssetType.STOCK)
            .slice() // Create a shallow copy to avoid mutating the original array
            .sort((a, b) => calculateAvkastning(b) - calculateAvkastning(a));
    }, [portfolio]);

    return (
        <div style={{ flex: 1, gap: '20px', backgroundColor: 'white', borderRadius: '8px', }}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px',
                    fontSize: '0.9rem',
                    height: '600px',
                }}
            >
                <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: 0, textAlign: 'center' }}>
                    Portefølje
                </p>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        borderBottom: '1px solid lightgrey',
                        gap: '8px',
                    }}
                >
                    <div style={{ width: '226px', textAlign: 'right' }}>Verdi</div>
                    <div style={{ width: '50px', textAlign: 'right' }}>Antall</div>
                    <div style={{ width: '80px', textAlign: 'right' }}>Kurs</div>
                    <div style={{ width: '80px', textAlign: 'right' }}>Pris</div>
                    <div style={{ width: '80px', textAlign: 'right' }}>Avkastning</div>
                </div>

                {/* Sorted Stocks List */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {sortedStocks.map((stock) => (
                        <StockRow key={stock.stock_symbol} asset={stock} />
                    ))}
                </div>

                <div 
                    style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '30px',
                    }}
                >
                    <PieChart data={pieChartData} width={300} height={300} />
                </div>
            </div>
        </div>
    );
};

export default PortfolioOverview;
