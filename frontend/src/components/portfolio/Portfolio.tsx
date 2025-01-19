import React, {useState, ChangeEvent} from 'react';
import { singleDecimal } from '../../utils';
import { Asset, AssetType, PortfolioValue } from '../../types';
import StockRow from './StockRow';
import GraphWithTimeFrame from '../graph/GraphWithTimeFrame';
import TypingFieldDropdown from '../TypingFieldDropdown';
import { Company, Transaction } from '../../types';
import { useFetchPrices } from '../../hooks/useFetchPrices';

interface PortfolioProps {
  portfolio: Asset[];
  portfolioValues: PortfolioValue[];
  trainedCompanies: Company[];
  transactions: Transaction[];
}

const Portfolio: React.FC<PortfolioProps> = ({ portfolio, portfolioValues, trainedCompanies, transactions }) => {
    const cash = portfolio.find(asset => asset.asset_type === AssetType.CASH);
    const saldo = cash?.total_value || 0;
    const available = cash?.available || 0;

    const equityOneDayAgo = portfolioValues[portfolioValues.length - 2].value;
    const equityToday = portfolioValues[portfolioValues.length - 1].value;
    const developmentPastDay = (equityToday - equityOneDayAgo) / equityOneDayAgo;
    const formattedDevelopmentPastDayPercentage = (developmentPastDay * 100).toFixed(2);
    const formattedDevelopmentPastDayValue = `${developmentPastDay >= 0 ? '+' : '-'}${singleDecimal(Math.abs(equityToday - equityOneDayAgo), 0)} NOK`;

    const formattedEquity = singleDecimal(equityToday, 0);
    const formattedSaldo = singleDecimal(saldo, 0);
    const formattedAvailable = singleDecimal(available, 0);
    const marketValue = singleDecimal(equityToday - saldo, 0);

    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const handleCompanyChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedCompany(e.target.value);
    };

    const {
        data: historicCompanyPrices,
        loading: pricesLoading,
        error: pricesError,
    } = useFetchPrices(selectedCompany);

    const filteredTransactions = transactions.filter(
        transaction => transaction.stock_symbol === selectedCompany
    );


    return (
        <div style={{ display: 'flex' }}>
            {/* Left Column */}
            <div style={{ flex: 1, padding: '0 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 20px' }}>
                    <div>
                        <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>Egenkapital (NOK)</p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{formattedEquity}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>Utvikling siste dag</p>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '2rem'  }}>
                            <p style={{ margin: 0, color: developmentPastDay >= 0 ? 'green' : 'red', marginRight: '1rem' }}>
                                {formattedDevelopmentPastDayPercentage}%
                            </p>
                            <p style={{ margin: 0, color: developmentPastDay >= 0 ? 'green' : 'red' }}>
                                {formattedDevelopmentPastDayValue}
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', width: 'calc(100% - 40px)', marginBottom: '3rem', padding: '0 20px' }}>
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

                <div style={{ flex: 1}}>
                    <GraphWithTimeFrame 
                        graphData={{ 
                            dates: portfolioValues.map(v => new Date(v.date).toISOString().split('T')[0]), 
                            prices: portfolioValues.map(v => v.value) 
                        }}
                        defaultTimeframe='max'
                    />
                </div>
            </div>

            {/* Right Column */}
            <div style={{ flex: 1, padding: '0 20px', fontSize: '0.9rem' }}> {/* marginTop: 'calc(4rem + 96px)' */}
                <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: 0 }}>Beholdning</p>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        // paddingBottom: '8px',
                        borderBottom: '1px solid lightgrey',
                        gap: '8px',
                    }}
                >
                    <div style={{ width: '186px', textAlign: 'right' }}>Verdi</div> {/* 8 (padding) + 80 + 8 (gap) + 90 */}
                    <div style={{ width: '50px', textAlign: 'right' }}>Antall</div> {/* 50 */}
                    <div style={{ width: '80px', textAlign: 'right' }}>Kurs</div>   {/* 80 */}
                    <div style={{ width: '80px', textAlign: 'right' }}>Pris</div>   {/* 80 */}
                    <div style={{ width: '80px', textAlign: 'right' }}>Avkastning</div>   {/* 80 */}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column'}}>
                    {portfolio
                        .filter(asset => asset.asset_type === AssetType.STOCK)
                        .map(stock => (
                            <StockRow key={stock.stock_symbol} asset={stock} />
                        ))}
                </div>

                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>Se aksjekurs</p>

                <TypingFieldDropdown
                    options={trainedCompanies}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleCompanyChange(e as unknown as ChangeEvent<HTMLSelectElement>)
                    }
                    placeholder="Velg selskap"
                />

                {historicCompanyPrices?.dates?.length > 0 && (
                    <GraphWithTimeFrame graphData={historicCompanyPrices} transactions={filteredTransactions} defaultTimeframe='1y' />
                )}
                
            </div>

            
        </div>
    );
};

export default Portfolio;
