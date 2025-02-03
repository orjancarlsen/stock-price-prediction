import React, { useState, useMemo } from 'react';
import Graph from './GradientGraph';
import TimeFrameSelector from './TimeFrameSelector';
import PercentageVsValueSelector from './PercentageVsValueSelector';
import { Transaction, TimeFrame } from 'src/types';
import ComparisonSelector from './ComparisonSelector';
import { useFetchPrices } from '../../hooks/useFetchPrices';

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
    default:
      daysToGoBack = 365;
      break;
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
    graphName: string;
    transactions?: Transaction[];
    defaultTimeframe?: TimeFrame;
    defaultPercentageVsValue?: 'percentage' | 'value';
}

const GraphWithTimeFrame: React.FC<GraphWithTimeFrameProps> = ({
    graphData,
    graphName,
    transactions = [],
    defaultTimeframe = 'max',
    defaultPercentageVsValue = 'percentage',
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(defaultTimeframe);
  const [compare, setCompare] = useState<string>('OSEBX.OL');
  const [percentageVsValue, setPercentageVsValue] = useState<'percentage' | 'value'>(defaultPercentageVsValue);

  // Fetch compare data using the selected index.
  const {
    data: compareData,
    loading: comparePricesLoading,
    error: comparePricesError,
  } = useFetchPrices(compare);

  const adjustedCompareData = compare === '' ? { dates: [], prices: [] } : compareData;

  // Precompute profit for each timeframe.
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

  // Filter the main data and transactions for the selected timeframe.
  const filteredMain = useMemo(() => {
    return filterDataByTimeFrame(graphData, transactions, timeFrame);
  }, [graphData, transactions, timeFrame]);

  // Slice the compare data so that it begins at the earliest date of the filtered main data.
  const slicedCompareData = useMemo(() => {
    if (!adjustedCompareData.dates.length) return { dates: [], prices: [] };

    const earliestFilteredDate = filteredMain.filteredData.dates[0];
    const latestFilteredDate =
      filteredMain.filteredData.dates[filteredMain.filteredData.dates.length - 1];
    if (!earliestFilteredDate || !latestFilteredDate) {
      return { dates: [], prices: [] };
    }

    const earliestTs = new Date(earliestFilteredDate).getTime();
    const latestTs = new Date(latestFilteredDate).getTime();

    const startIdx = adjustedCompareData.dates.findIndex(
      (d) => new Date(d).getTime() >= earliestTs
    );
    if (startIdx === -1) {
      return { dates: [], prices: [] };
    }

    const endIdx = adjustedCompareData.dates.findIndex(
      (d) => new Date(d).getTime() > latestTs
    );
    const endSliceIdx = endIdx === -1 ? adjustedCompareData.dates.length : endIdx;

    const newDates = adjustedCompareData.dates.slice(startIdx, endSliceIdx);
    const newPrices = adjustedCompareData.prices.slice(startIdx, endSliceIdx);

    return { dates: newDates, prices: newPrices };
  }, [compareData, filteredMain]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: '10px',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', marginLeft: '8px' }}>
              <ComparisonSelector onChange={setCompare} />
              <PercentageVsValueSelector defaultValue={defaultPercentageVsValue} onChange={setPercentageVsValue} />
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', marginRight: '80px' }}>
              <TimeFrameSelector
                onChange={setTimeFrame}
                profitsMap={profitsMap}
                defaultTimeFrame={defaultTimeframe}
              />
            </div>
        </div>

        <Graph
            graphData={filteredMain.filteredData}
            graphName={graphName}
            transactions={filteredMain.filteredTransactions}
            compareData={slicedCompareData}
            compareName={compare}
            percentageVsValue={percentageVsValue}
        />
    </div>
  );
};

export default GraphWithTimeFrame;
