import React, { useState, useMemo } from 'react';
import Graph from './GradientGraph';
import TimeFrameSelector from './TimeFrameSelector';
import { Transaction, TimeFrame } from 'src/types';

type HistoricData = {
  dates: string[];
  prices: number[];
};

function filterDataByTimeFrame(
    data: HistoricData,
    transactions: Transaction[],
    timeframe: '1w' | '1m' | '3m' | '1y' | 'max'
): { filteredData: HistoricData, filteredTransactions: Transaction[] } {
    const { dates, prices } = data;

    // If 'max', simply return all data and transactions
    if (timeframe === 'max') {
        return { filteredData: data, filteredTransactions: transactions };
    }

    const now = new Date(dates[dates.length - 1]).getTime();

    let daysToGoBack = 0;
    switch (timeframe) {
        case '1w':
            daysToGoBack = 7;
            break;
        case '1m':
            daysToGoBack = 30;
            break;
        case '3m':
            daysToGoBack = 90;
            break;
        case '1y':
            daysToGoBack = 365;
            break;
    }

    // Calculate the cutoff date in ms
    const cutoffDate = now - daysToGoBack * 24 * 60 * 60 * 1000;

    // Filter the data
    const filteredDates: string[] = [];
    const filteredPrices: number[] = [];
    const filteredTransactions: Transaction[] = transactions.filter(transaction => new Date(transaction.timestamp).getTime() >= cutoffDate);

    for (let i = 0; i < dates.length; i++) {
        const dateMs = new Date(dates[i]).getTime();
        if (dateMs >= cutoffDate) {
            filteredDates.push(dates[i]);
            filteredPrices.push(prices[i]);
        }
    }

    return { filteredData: { dates: filteredDates, prices: filteredPrices }, filteredTransactions };
}

export function computePercentageProfit(dates: string[], prices: number[]): number {
    if (dates.length < 2) return 0;
  
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
  
    if (firstPrice === 0) return 0;
  
    return ((lastPrice - firstPrice) / firstPrice) * 100;
}

interface GraphWithTimeFrameProps {
    graphData: HistoricData;
    transactions?: Transaction[];
    defaultTimeframe?: TimeFrame;
}

const GraphWithTimeFrame: React.FC<GraphWithTimeFrameProps> = ({
    graphData,
    transactions = [],
    defaultTimeframe = 'max'
}) => {
    const [timeFrame, setTimeFrame] = useState<TimeFrame>(
        defaultTimeframe
  );

    const profitsMap = useMemo(() => {
        const timeFrames: TimeFrame[] = ['1w', '1m', '3m', '1y', 'max'];
        const result: { [key in TimeFrame]: number } = {
            '1w': 0, '1m': 0, '3m': 0, '1y': 0, 'max': 0
        };

        timeFrames.forEach((tf) => {
            const filteredData = filterDataByTimeFrame(graphData, transactions, tf);
            result[tf] = computePercentageProfit(filteredData.filteredData.dates, filteredData.filteredData.prices);
        });

        return result;
    }, [graphData]);

    const filteredData = useMemo(
        () => filterDataByTimeFrame(graphData, transactions, timeFrame),
        [graphData, timeFrame, transactions]
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginLeft: '60px'}}>
                <TimeFrameSelector onChange={setTimeFrame} profitsMap={profitsMap} defaultTimeFrame={defaultTimeframe} />
            </div>
            <Graph graphData={filteredData.filteredData} transactions={transactions} />
        </div>
    );
};

export default GraphWithTimeFrame;
