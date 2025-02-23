import React from 'react';
import './CompanyPage.css';
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
      } = useFetchCompanies('/companies/available');

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

    const todaysTotalValue = asset && asset.todays_value !== undefined && asset.number_of_shares !== undefined
        ? asset.todays_value * asset.number_of_shares
        : 0;

    return (
        <div className="company-page-container">
            <Header trainedCompanies={trainedCompanies} name={name} />

            <div className="content-container">
                <div className="graph-container">
                    {asset && (
                        <div className="summary-container">
                            <div className="summary-content">
                                <div className="summary-header">
                                    <p className="label">Aksjeverdi (NOK)</p>
                                </div>
                                <div className="summary-item">
                                    <p className="value">{singleDecimal(todaysTotalValue, 1)}</p>
                                </div>
                            </div>

                            <div className="summary-content">
                                <div className="summary-header">
                                    <p className="label">Antall aksjer</p>
                                </div>
                                <div className="summary-item">
                                    <p className="value">{asset.number_of_shares}</p>
                                </div>
                            </div>

                            <div className="summary-content">
                                <div className="summary-header">
                                    <p className="label">Dagens kurs (NOK)</p>
                                </div>
                                <div className="summary-item">
                                    <p className="value">{singleDecimal(asset.todays_value)}</p>
                                </div>
                            </div>

                            <div className="summary-content">
                                <div className="summary-header">
                                    <p className="label">Pris per aksje (NOK)</p>
                                </div>
                                <div className="summary-item">
                                    <p className="value">{asset.price_per_share?.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="summary-content">
                                <div className="summary-header">
                                    <p className="label">Avkastning</p>
                                </div>
                                <div className="summary-item">
                                    <p className="value" style={{ color: profit >= 0 ? 'green' : 'red' }}>
                                        {formattedProfit}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {!asset && <div className="no-asset">Denne aksjen er ikke i porteføljen.</div>}
                    <GraphWithTimeFrame
                        graphData={historicCompanyPrices}
                        graphName={ticker || ''}
                        transactions={filteredTransactions}
                        defaultTimeframe="1y"
                        defaultPercentageVsValue="value"
                    />
                </div>

                <div className="action-container">
                    <ActionOverview transactions={filteredTransactions} orders={filteredOrders} />
                </div>
            </div>
        </div>
    );
};

export default CompanyPage;
