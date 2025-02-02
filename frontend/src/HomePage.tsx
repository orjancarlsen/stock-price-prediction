import React, { useState } from 'react';
import PortfolioOverview from './components/portfolio/PotfolioOverview';
import EquityOverview from './components/EquityOverview';
import ActionOverview from './components/ActionOverview';
import LoadingAnimation from './components/LoadingAnimation';
import { useFetchCompanies } from './hooks/useFetchCompanies';
import { useFetchPortfolio } from './hooks/useFetchPortfolio';
import { useFetchPortfolioValues } from './hooks/useFetchPortfolioValues';
import { useFetchTransactions } from './hooks/useFetchTransactions';
import { useFetchOrders } from './hooks/useFetchOrders';
import Header from './components/Header';

function HomePage() {
    const {
        companies: trainedCompanies,
        error: trainedCompaniesError,
        loading: trainedCompaniesLoading,
    } = useFetchCompanies('/companies/trained');

    const portfolio = useFetchPortfolio();
    const portfolioValues = useFetchPortfolioValues();
    const transactions = useFetchTransactions();
    const orders = useFetchOrders();

    if (trainedCompaniesLoading) {
        return <LoadingAnimation/>;
    }

    if (trainedCompaniesError) {
        return <div>Error fetching companies: {trainedCompaniesError}</div>;
    }

    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
            <Header trainedCompanies={trainedCompanies}/>
            
            <div style={{ display: 'flex', gap: '20px', overflow: 'hidden', padding: '20px' }}>
                <div style={{ flex: 1 }}>
                    <EquityOverview portfolio={portfolio} portfolioValues={portfolioValues} />
                </div>

                <div style={{ flex: 1 }}>
                    <PortfolioOverview portfolio={portfolio} />
                </div>

                <div style={{ width: '440px' }}>
                    <ActionOverview transactions={transactions} orders={orders}/>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
