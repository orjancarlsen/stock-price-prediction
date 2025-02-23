import React from 'react';
import './HomePage.css';
import PortfolioOverview from './components/portfolio/PortfolioOverview';
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
    } = useFetchCompanies('/companies/available');

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
        <div className="homepage-container">
            <Header trainedCompanies={trainedCompanies} />
            
            <div className="content-container">
                <div className="equity-overview">
                    <EquityOverview portfolio={portfolio} portfolioValues={portfolioValues} />
                </div>
                <div className="portfolio-overview">
                    <PortfolioOverview portfolio={portfolio} />
                </div>
                <div className="action-overview">
                    <ActionOverview transactions={transactions} orders={orders} />
                </div>
            </div>
        </div>
    );
}

export default HomePage;
