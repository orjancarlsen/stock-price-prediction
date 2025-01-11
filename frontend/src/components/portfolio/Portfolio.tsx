import React from 'react'; 
import { Asset, AssetType } from '../../types';
import StockRow from './StockRow';
import { singleDecimal, formatSingleDecimal } from '../../utils';

interface PortfolioProps {
  portfolio: Asset[];
}

const Portfolio: React.FC<PortfolioProps> = ({ portfolio }) => {
  const cash = portfolio.find(asset => asset.asset_type === AssetType.CASH);
  const equity = portfolio.reduce((sum, asset) => sum + asset.total_value, 0);
  const saldo = cash?.total_value || 0;
  const available = cash?.available || 0;

  const formattedEquity = singleDecimal(equity, 0);
  const formattedSaldo = singleDecimal(saldo, 0);
  const formattedAvailable = singleDecimal(available, 0);
  const marketValue = singleDecimal(equity - saldo, 0);

  return (
    <div style={{ display: 'flex' }}>
        {/* Left Column */}
        <div style={{ flex: 1, padding: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>Egenkapital (NOK)</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{formattedEquity}</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', marginBottom: '4rem' }}>
                <div>
                    <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>Aksjeverdi (NOK)</p>
                    <p style={{ fontSize: '1.2rem', margin: 0 }}>{marketValue}</p>
                </div>
                <div>
                    <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>Saldo (NOK)</p>
                    <p style={{ fontSize: '1.2rem', margin: 0 }}>{formattedSaldo}</p>
                </div>
                <div>
                    <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>Tilgjengelig (NOK)</p>
                    <p style={{ fontSize: '1.2rem', margin: 0 }}>{formattedAvailable}</p>
                </div>
            </div>

            {/* Add Headers for Stock Table */}
            <div style={{ display: 'flex', padding: '0 8px', fontSize: '0.9rem', gap: '8px' }}>
                <div style={{ width: '188px', padding: '0 8px', textAlign: 'right' }}>Verdi</div>
                <div style={{ width: '50px', padding: '0 8px', textAlign: 'right' }}>Antall</div>
                <div style={{ width: '80px', padding: '0 8px', textAlign: 'right' }}>Pris</div>
            </div>

            {portfolio
                .filter(asset => asset.asset_type === AssetType.STOCK)
                .map((stock, index) => (
                    <React.Fragment key={index}>
                        {index < portfolio.length - 1 && (
                            <hr style={{ border: 'none', borderTop: '1px solid lightgrey', margin: '0.5rem 0' }} />
                        )}
                        <StockRow asset={stock} />
                    </React.Fragment>
                ))
            }

        </div>

        {/* Right Column */}
        <div></div>
    </div>
  );
};

export default Portfolio;
