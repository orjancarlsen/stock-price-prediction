// CompanyPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import LoadingAnimation from './components/LoadingAnimation';
import GraphWithTimeFrame from './components/graph/GraphWithTimeFrame';
import { useFetchPrices } from './hooks/useFetchPrices';
import { useFetchTransactions } from './hooks/useFetchTransactions';
import { useFetchOrders } from './hooks/useFetchOrders';
import { useFetchCompanies } from './hooks/useFetchCompanies';
import Header from './components/Header';
import ActionOverview from './components/ActionOverview';


const CompanyPage: React.FC = () => {
    const { ticker } = useParams<{ ticker: string }>();

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


    if (pricesLoading) return <LoadingAnimation />;
    if (pricesError) return <div>Error fetching prices: {pricesError}</div>;

    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
            <Header trainedCompanies={trainedCompanies}/>

            <div style={{ display: 'flex', gap: '20px', overflow: 'hidden', padding: '20px' }}>
                <div style={{ flex: 1, borderRadius: '8px', backgroundColor: 'white', padding: '20px' }}>
                    <GraphWithTimeFrame
                        graphData={historicCompanyPrices}
                        transactions={filteredTransactions}
                        defaultTimeframe="1y"
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
