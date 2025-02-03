import React from 'react';
import { useParams } from 'react-router-dom';
import LoadingAnimation from './components/LoadingAnimation';
import GraphWithTimeFrame from './components/graph/GraphWithTimeFrame';
import { useFetchPrices } from './hooks/useFetchPrices';
import { useFetchTransactions } from './hooks/useFetchTransactions';
import { useFetchOrders } from './hooks/useFetchOrders';
import { useFetchCompanies } from './hooks/useFetchCompanies';
import { useFetchPortfolio } from './hooks/useFetchPortfolio';
import Header from './components/Header';
import ActionOverview from './components/ActionOverview';
import { singleDecimal } from './utils';

const CompanyPage: React.FC = () => {
    const { ticker } = useParams<{ ticker: string }>();

    const portfolio = useFetchPortfolio();
    const asset = portfolio.find((asset) => asset.stock_symbol === ticker);

    const {
        data: historicCompanyPrices,
        loading: pricesLoading,
        error: pricesError,
    } = useFetchPrices(ticker || '');

    const {
        companies: trainedCompanies,
        error: trainedCompaniesError,
        loading: trainedCompaniesLoading,
      } = useFetchCompanies('/companies/trained');

    const transactions = useFetchTransactions();
    const filteredTransactions = transactions.filter(
        (transaction) => transaction.stock_symbol === ticker
    );

    const orders = useFetchOrders();
    const filteredOrders = orders.filter(
        (order) => order.stock_symbol === ticker
    );

    const name = trainedCompanies.find((company) => company.symbol === ticker)?.name;

    if (pricesLoading) return <LoadingAnimation />;
    if (pricesError) return <div>Error fetching prices: {pricesError}</div>;

    const profit = asset && asset.todays_value !== undefined && asset.price_per_share !== undefined && asset.number_of_shares !== undefined
        ? (asset.todays_value - asset.price_per_share ) / asset.price_per_share
        : 0;
    const formattedProfit = (profit * 100).toFixed(2);

    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
            <Header trainedCompanies={trainedCompanies} name={name}/>

            <div style={{ display: 'flex', gap: '20px', overflow: 'hidden', padding: '20px' }}>
                <div style={{ flex: 1, borderRadius: '8px', backgroundColor: 'white', padding: '20px' }}>
                    {asset && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                width: '900px',
                                marginBottom: '3rem',
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>
                                    Aksjeverdi (NOK)
                                </p>
                                <p style={{ fontSize: '1.2rem', margin: 0 }}>
                                    {singleDecimal(asset.total_value, 0)}
                                </p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>
                                    Antall aksjer
                                </p>
                                <p style={{ fontSize: '1.2rem', margin: 0 }}>
                                    {asset.number_of_shares}
                                </p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>
                                    Dagens kurs (NOK)
                                </p>
                                <p style={{ fontSize: '1.2rem', margin: 0 }}>
                                    {singleDecimal(asset.todays_value)}
                                </p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>
                                    Pris per aksje (NOK)
                                </p>
                                <p style={{ fontSize: '1.2rem', margin: 0 }}>
                                    {asset.price_per_share}
                                </p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '1rem', margin: 0, color: 'grey' }}>
                                    Avkastning
                                </p>
                                <p style={{ fontSize: '1.2rem', margin: 0, color: profit >= 0 ? 'green' : 'red' }}>
                                    {formattedProfit}%
                                </p>
                            </div>
                        </div>
                    )}
                    {!asset && (
                        <div style={{ marginBottom: '3rem' }}>
                            Denne aksjen er ikke i porteføljen.
                        </div>
                    )}
                    <GraphWithTimeFrame
                        graphData={historicCompanyPrices}
                        transactions={filteredTransactions}
                        defaultTimeframe="1y"
                        defaultPercentageVsValue='value'
                    />
                </div>

                <div style={{ width: '440px' }}>
                    <ActionOverview transactions={filteredTransactions} orders={filteredOrders}/>
                </div>
            </div>
        </div>
    );
};

export default CompanyPage;
