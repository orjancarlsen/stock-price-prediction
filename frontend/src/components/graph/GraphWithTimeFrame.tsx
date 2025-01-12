import React, { useState, useMemo } from 'react';
import Graph from './GradientGraph';
import TimeFrameSelector, { TimeFrame } from './TimeFrameSelector';

type HistoricData = {
  dates: string[];
  prices: number[];
};

function filterDataByTimeFrame(
    data: HistoricData,
    timeframe: '1w' | '1m' | '3m' | '1y' | 'max'
): HistoricData {
    const { dates, prices } = data;

    // If 'max', simply return all data
    if (timeframe === 'max') {
        return data;
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

    for (let i = 0; i < dates.length; i++) {
        const dateMs = new Date(dates[i]).getTime();
        if (dateMs >= cutoffDate) {
            filteredDates.push(dates[i]);
            filteredPrices.push(prices[i]);
        }
    }

    return { dates: filteredDates, prices: filteredPrices };
}

export function computePercentageProfit(dates: string[], prices: number[]): number {
    if (dates.length < 2) return 0;
  
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
  
    if (firstPrice === 0) return 0;
  
    return ((lastPrice - firstPrice) / firstPrice) * 100;
}

interface GraphWithTimeFrameProps {
    historicCompanyPrices: HistoricData;
}

const GraphWithTimeFrame: React.FC<GraphWithTimeFrameProps> = ({
    historicCompanyPrices,
}) => {
    const [timeFrame, setTimeFrame] = useState<TimeFrame>(
        'max'
  );

    const profitsMap = useMemo(() => {
        const timeFrames: TimeFrame[] = ['1w', '1m', '3m', '1y', 'max'];
        const result: { [key in TimeFrame]: number } = {
            '1w': 0, '1m': 0, '3m': 0, '1y': 0, 'max': 0
        };

        timeFrames.forEach((tf) => {
            const filteredData = filterDataByTimeFrame(historicCompanyPrices, tf);
            result[tf] = computePercentageProfit(filteredData.dates, filteredData.prices);
        });

        return result;
    }, [historicCompanyPrices]);

    const filteredData = useMemo(
        () => filterDataByTimeFrame(historicCompanyPrices, timeFrame),
        [historicCompanyPrices, timeFrame]
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginLeft: '60px'}}>
                <TimeFrameSelector onChange={setTimeFrame} profitsMap={profitsMap} />
            </div>
            <Graph historicCompanyPrices={filteredData} />
        </div>
    );
};

export default GraphWithTimeFrame;
