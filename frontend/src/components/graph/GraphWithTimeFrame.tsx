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
) {
  if (timeframe === 'max') {
    return { filteredData: data, filteredTransactions: transactions };
  }

  const now = Date.now();
  let daysToGoBack = 0;
  switch (timeframe) {
    case '1w': daysToGoBack = 7;   break;
    case '1m': daysToGoBack = 30;  break;
    case '3m': daysToGoBack = 90;  break;
    case '1y': daysToGoBack = 365; break;
    default:   daysToGoBack = 365; break; // fallback
  }

  const cutoffDate = now - daysToGoBack * 24 * 60 * 60 * 1000;

  const { dates, prices } = data;
  const filteredDates: string[] = [];
  const filteredPrices: number[] = [];

  for (let i = 0; i < dates.length; i++) {
    const dateMs = new Date(dates[i]).getTime();
    if (dateMs >= cutoffDate) {
      filteredDates.push(dates[i]);
      filteredPrices.push(prices[i]);
    }
  }

  const filteredTransactions = transactions.filter(
    (t) => new Date(t.timestamp).getTime() >= cutoffDate
  );

  return {
    filteredData: { dates: filteredDates, prices: filteredPrices },
    filteredTransactions,
  };
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
  compareData?: HistoricData;
  compareName?: string;
}

const GraphWithTimeFrame: React.FC<GraphWithTimeFrameProps> = ({
  graphData,
  transactions = [],
  defaultTimeframe = 'max',
  compareData = { dates: [], prices: [] },
  compareName = 'Sammenligning',
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(defaultTimeframe);

  // Precompute profit for each timeframe
  const profitsMap = useMemo(() => {
    const timeFrames: TimeFrame[] = ['1w', '1m', '3m', '1y', 'max'];
    const result: { [key in TimeFrame]: number } = {
      '1w': 0,
      '1m': 0,
      '3m': 0,
      '1y': 0,
      'max': 0,
    };
    timeFrames.forEach((tf) => {
      const filtered = filterDataByTimeFrame(graphData, transactions, tf);
      result[tf] = computePercentageProfit(
        filtered.filteredData.dates,
        filtered.filteredData.prices
      );
    });
    return result;
  }, [graphData, transactions]);

  // 1) Filter the main data + transactions for the selected timeframe
  const filteredMain = useMemo(() => {
    return filterDataByTimeFrame(graphData, transactions, timeFrame);
  }, [graphData, transactions, timeFrame]);

  // 2) Slice the compare data so that it begins at the earliest date of the *filtered main data*
const slicedCompareData = useMemo(() => {
    if (!compareData.dates.length) return { dates: [], prices: [] };

    const earliestFilteredDate = filteredMain.filteredData.dates[0];
    const latestFilteredDate = filteredMain.filteredData.dates[filteredMain.filteredData.dates.length - 1];
    if (!earliestFilteredDate || !latestFilteredDate) {
        // If there's no data in the filtered main, just return empty
        return { dates: [], prices: [] };
    }

    // Convert earliest and latest dates to numeric timestamps
    const earliestTs = new Date(earliestFilteredDate).getTime();
    const latestTs = new Date(latestFilteredDate).getTime();

    // Find the first compare date that is >= earliestTs
    const startIdx = compareData.dates.findIndex(
        (d) => new Date(d).getTime() >= earliestTs
    );
    if (startIdx === -1) {
        // No compare date is on or after earliestTs => no overlap
        return { dates: [], prices: [] };
    }

    // Find the last compare date that is <= latestTs
    const endIdx = compareData.dates.findIndex(
        (d) => new Date(d).getTime() > latestTs
    );
    const endSliceIdx = endIdx === -1 ? compareData.dates.length : endIdx;

    // Slice from startIdx to endSliceIdx
    const newDates = compareData.dates.slice(startIdx, endSliceIdx);
    const newPrices = compareData.prices.slice(startIdx, endSliceIdx);

    return { dates: newDates, prices: newPrices };
}, [compareData, filteredMain]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginLeft: '60px' }}>
        <TimeFrameSelector
          onChange={setTimeFrame}
          profitsMap={profitsMap}
          defaultTimeFrame={defaultTimeframe}
        />
      </div>
      <Graph
        graphData={filteredMain.filteredData}
        transactions={filteredMain.filteredTransactions}
        compareData={slicedCompareData}
        compareName={compareName}
      />
    </div>
  );
};

export default GraphWithTimeFrame;
