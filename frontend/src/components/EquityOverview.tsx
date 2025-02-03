import React from 'react';
import GraphWithTimeFrame from './graph/GraphWithTimeFrame';
import { Asset, AssetType, PortfolioValue } from '../types';
import { useFetchPrices } from '../hooks/useFetchPrices';
import { singleDecimal } from '../utils';


interface EquityOverviewProps {
    portfolio: Asset[];
    portfolioValues: PortfolioValue[];
}

const EquityOverview: React.FC<EquityOverviewProps> = ({
    portfolio,
    portfolioValues,
}) => {
    // Cash Asset
    const cash = portfolio.find((asset) => asset.asset_type === AssetType.CASH);
    const saldo = cash?.total_value || 0;
    const available = cash?.available || 0;

    // Equity Calculations
    const equityToday = portfolioValues[portfolioValues.length - 1]?.value || 0;
    const equityOneDayAgo = portfolioValues[portfolioValues.length - 2]?.value || 0;
    const developmentPastDay = equityOneDayAgo !== 0 ? (equityToday - equityOneDayAgo) / equityOneDayAgo : 0;
    const formattedDevelopmentPastDayPercentage = (developmentPastDay * 100).toFixed(2);
    const formattedDevelopmentPastDayValue = `${
        developmentPastDay >= 0 ? '+' : '-'
    }${singleDecimal(Math.abs(equityToday - equityOneDayAgo), 0)} NOK`;
    
    // Formatting Values
    const formattedEquity = singleDecimal(equityToday, 0);
    const formattedSaldo = singleDecimal(saldo, 0);
    const formattedAvailable = singleDecimal(available, 0);
    const marketValue = singleDecimal(equityToday - saldo, 0);

    return (
        <div style={{ flex: 1, padding: '20px', backgroundColor: 'white', borderRadius: '8px', height: '600px' }} >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    padding: '0 20px',
                }}
            >
                <div>
                    <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>
                        Egenkapital (NOK)
                    </p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                        {formattedEquity}
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>
                        Utvikling siste dag
                    </p>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '2rem',
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                color: developmentPastDay >= 0 ? 'green' : 'red',
                                marginRight: '1rem',
                            }}
                        >
                            {formattedDevelopmentPastDayPercentage}%
                        </p>
                        <p
                            style={{
                                margin: 0,
                                color: developmentPastDay >= 0 ? 'green' : 'red',
                            }}
                        >
                            {formattedDevelopmentPastDayValue}
                        </p>
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: 'calc(100% - 40px)',
                    marginBottom: '3rem',
                    padding: '0 20px',
                }}
            >
                <div>
                    <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>
                        Aksjeverdi (NOK)
                    </p>
                    <p style={{ fontSize: '1.2rem', margin: 0 }}>{marketValue}</p>
                </div>
                <div>
                    <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>
                        Saldo (NOK)
                    </p>
                    <p style={{ fontSize: '1.2rem', margin: 0 }}>{formattedSaldo}</p>
                </div>
                <div>
                    <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>
                        Tilgjengelig (NOK)
                    </p>
                    <p style={{ fontSize: '1.2rem', margin: 0 }}>{formattedAvailable}</p>
                </div>
            </div>

            <div style={{ flex: 1 }}>
                <GraphWithTimeFrame
                    graphData={{
                        dates: portfolioValues.map((v) =>
                            new Date(v.date).toISOString().split('T')[0]
                        ),
                        prices: portfolioValues.map((v) => v.value),
                    }}
                    graphName="Portefølje"
                    defaultTimeframe="max"
                    defaultPercentageVsValue='percentage'
                />
            </div>
        </div>
    );
};

export default EquityOverview;