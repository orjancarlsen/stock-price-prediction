// CompanyPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import LoadingAnimation from './components/LoadingAnimation';
import GraphWithTimeFrame from './components/graph/GraphWithTimeFrame';
import { useFetchPrices } from './hooks/useFetchPrices';
import { useFetchTransactions } from './hooks/useFetchTransactions';
import { useFetchCompanies } from './hooks/useFetchCompanies';
import Header from './components/Header';


const CompanyPage: React.FC = () => {
    const { ticker } = useParams<{ ticker: string }>();

    const {
        data: historicCompanyPrices,
        loading: pricesLoading,
        error: pricesError,
    } = useFetchPrices(ticker || '');

    const {
        data: indexPrices,
        loading: indexPricesLoading,
        error: indexPricesError,
    } = useFetchPrices('OSEBX.OL');

    const {
        companies: trainedCompanies,
        error: trainedCompaniesError,
        loading: trainedCompaniesLoading,
      } = useFetchCompanies('/companies/trained');

    const transactions = useFetchTransactions();
    const filteredTransactions = transactions.filter(
        (transaction) => transaction.stock_symbol === ticker
    );

  if (pricesLoading) return <LoadingAnimation />;
  if (pricesError) return <div>Error fetching prices: {pricesError}</div>;

  return (
    <div>
        <Header trainedCompanies={trainedCompanies}/>
        {historicCompanyPrices?.dates?.length > 0 && (
            <GraphWithTimeFrame
                graphData={historicCompanyPrices}
                transactions={filteredTransactions}
                defaultTimeframe="1y"
                compareData={indexPrices}
            />
        )}
    </div>
  );
};

export default CompanyPage;
