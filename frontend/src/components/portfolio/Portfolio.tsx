import React, { useState, ChangeEvent, useMemo } from 'react';
import { singleDecimal } from '../../utils';
import { Asset, AssetType, PortfolioValue } from '../../types';
import StockRow from './StockRow';
import GraphWithTimeFrame from '../graph/GraphWithTimeFrame';
import TypingFieldDropdown from '../TypingFieldDropdown';
import { Company, Transaction } from '../../types';
import { useFetchPrices } from '../../hooks/useFetchPrices';
import PieChart from './PieChart';

interface PortfolioProps {
    portfolio: Asset[];
    portfolioValues: PortfolioValue[];
    trainedCompanies: Company[];
    transactions: Transaction[];
}

const Portfolio: React.FC<PortfolioProps> = ({
    portfolio,
    portfolioValues,
    trainedCompanies,
    transactions,
}) => {
    // Cash Asset
    const cash = portfolio.find((asset) => asset.asset_type === AssetType.CASH);
    const saldo = cash?.total_value || 0;
    const available = cash?.available || 0;

    // Equity Calculations
    const equityOneDayAgo = portfolioValues[portfolioValues.length - 2]?.value || 0;
    const equityToday = portfolioValues[portfolioValues.length - 1]?.value || 0;
    const developmentPastDay =
        equityOneDayAgo !== 0 ? (equityToday - equityOneDayAgo) / equityOneDayAgo : 0;
    const formattedDevelopmentPastDayPercentage = (developmentPastDay * 100).toFixed(2);
    const formattedDevelopmentPastDayValue = `${
        developmentPastDay >= 0 ? '+' : '-'
    }${singleDecimal(Math.abs(equityToday - equityOneDayAgo), 0)} NOK`;

    // Formatting Values
    const formattedEquity = singleDecimal(equityToday, 0);
    const formattedSaldo = singleDecimal(saldo, 0);
    const formattedAvailable = singleDecimal(available, 0);
    const marketValue = singleDecimal(equityToday - saldo, 0);

    // Company Selection State
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const handleCompanyChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedCompany(e.target.value);
    };

    // Fetch Historic Prices
    const {
        data: historicCompanyPrices,
        loading: pricesLoading,
        error: pricesError,
    } = useFetchPrices(selectedCompany);

    // Fetch index prices
    const {
        data: indexPrices,
        loading: indexPricesLoading,
        error: indexPricesError,
    } = useFetchPrices('OSEBX.OL');

    const pieChartData = portfolio.map(asset => {
      if (asset.asset_type === AssetType.CASH) {
        return { name: 'Saldo', value: asset.total_value };
      } else if (asset.asset_type === AssetType.STOCK) {
        return { name: asset.stock_symbol || 'Unknown', value: (asset.todays_value ?? 0) * (asset.number_of_shares ?? 0) };
      }
      return { name: 'Unknown', value: 0 };
    });


    // Filter Transactions for Selected Company
    const filteredTransactions = transactions.filter(
        (transaction) => transaction.stock_symbol === selectedCompany
    );

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
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* Left Column */}
      <div style={{ flex: 1, padding: '1rem 1rem', backgroundColor: 'white', borderRadius: '8px' }} >
        {/* Equity and Daily Development */}
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

        {/* Market Value, Saldo, and Available */}
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

        {/* Equity Graph */}
        <div style={{ flex: 1 }}>
          <GraphWithTimeFrame
            graphData={{
              dates: portfolioValues.map((v) =>
                new Date(v.date).toISOString().split('T')[0]
              ),
              prices: portfolioValues.map((v) => v.value),
            }}
            defaultTimeframe="max"
            compareData={indexPrices}
            compareName='OSEBX'
          />
        </div>
      </div>

      {/* Right Column */}
      <div style={{ flex: 1, padding: '20px 20px', fontSize: '0.9rem', backgroundColor: 'white', borderRadius: '8px' }}>
        {/* Holdings Header */}
        <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: 0 }}>
          Beholdning
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            borderBottom: '1px solid lightgrey',
            gap: '8px',
          }}
        >
          <div style={{ width: '186px', textAlign: 'right' }}>Verdi</div>
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

        <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <PieChart data={pieChartData} width={300} height={300} />
        </div>

        {/* Section to View Stock Prices */}
        {/* <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>Se aksjekurs</p>

        <TypingFieldDropdown
          options={trainedCompanies}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleCompanyChange(
              e as unknown as ChangeEvent<HTMLSelectElement>
            )
          }
          placeholder="Velg selskap"
        />

        {historicCompanyPrices?.dates?.length > 0 && (
          <GraphWithTimeFrame
            graphData={historicCompanyPrices}
            transactions={filteredTransactions}
            defaultTimeframe="1y"
            compareData={indexPrices}
          />
        )} */}
      </div>
    </div>
  );
};

export default Portfolio;
