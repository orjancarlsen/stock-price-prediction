import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  ChartOptions
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Transaction } from 'src/types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
);

let previousChartArea: any;
let cachedGradient: CanvasGradient | undefined;

interface GraphProps {
  graphData: {
    dates: string[];
    prices: number[];
  };
  transactions?: Transaction[];
  compareData?: {
    dates: string[];
    prices: number[];
  };
  compareName: string;
}

const Graph: React.FC<GraphProps> = ({
  graphData,
  transactions,
  compareData,
  compareName
}) => {
    console.log('graphData', graphData);
    console.log('compareData', compareData);

    const mainBasePrice = graphData.prices[0];
    const mainPercentData = graphData.prices.map(
        (price) => ((price - mainBasePrice) / mainBasePrice) * 100
    );

    let comparePercentData: number[] = [];
    if (compareData && compareData.dates && compareData.prices) {
        const indexBasePrice = compareData.prices[0];
        comparePercentData = compareData.prices.map(
            (price) => ((price - indexBasePrice) / indexBasePrice) * 100
        );
    }

    const transactionMap = new Map<number, { realValue: number; type: string }>();
    (transactions || []).forEach((tx) => {
        const dateStr = new Date(tx.timestamp).toISOString().split('T')[0];
        const dateIndex = graphData.dates.indexOf(dateStr);
        if (dateIndex !== -1) {
        transactionMap.set(dateIndex, {
            realValue: tx.price_per_share ?? 0,
            type: tx.transaction_type,
        });
        }
    });

    const mainDataPoints = graphData.dates.map((dateStr, i) => ({
        x: dateStr,
        y: mainPercentData[i],
    }));

    const compareDataPoints =
    compareData && compareData.dates
      ? compareData.dates.map((dateStr, i) => ({
          x: dateStr,
          y: comparePercentData[i],
        }))
      : [];

    const transactionDataPoints = graphData.dates
        .map((dateStr, i) => {
            if (!transactionMap.has(i)) return null;
            return {
                x: dateStr,
                y: mainPercentData[i],
            };
        })
        .filter((pt): pt is { x: string; y: number } => pt !== null);

  // ----- Gradient for main line fill -----
  const getGradient = (ctx: CanvasRenderingContext2D, chartArea: { top: number; bottom: number }) => {
    if (!cachedGradient || chartArea !== previousChartArea) {
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(1, 'rgba(64, 105, 225, 0.8)');
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      cachedGradient = gradient;
      previousChartArea = chartArea;
    }
    return cachedGradient;
  };

  function formatAsLocalYYYYMMDD(dateObj: Date): string {
    // Get local year/month/day
    const year = dateObj.getFullYear();
    // Note: getMonth() is zero-based, so add 1
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // e.g. "2025-01-21"
  }
  

    // ----- Tooltip handling -----
    const tooltipCallbacks = {
        callbacks: {
            label: function (context: any) {
                const datasetLabel = context.dataset.label;
                const value = context.parsed.y;

                if (datasetLabel === 'Transactions') {
                    const rawX = context.parsed.x;  // e.g. 1735603200000
                    const dateObj = new Date(rawX); // convert to JS Date
                    const dayOnly = formatAsLocalYYYYMMDD(dateObj);
                    const idx = graphData.dates.indexOf(dayOnly);
                    if (idx === -1) return '';

                    const txInfo = transactionMap.get(idx);
                    if (!txInfo) return '';
                    const txLabel =
                        txInfo.type === 'BUY'
                            ? 'Kjøp'
                            : txInfo.type === 'SELL'
                            ? 'Salg'
                            : txInfo.type === 'DIVIDEND'
                            ? 'Utbytte'
                            : 'Ukjent';
                    return `${txLabel}: ${txInfo.realValue.toFixed(2)}`;
                }
                if (value == null) return '';
                return `${datasetLabel}: ${value.toFixed(2)}%`;
            },
        },
    };

    // ----- Build datasets -----
    const mainDataset = {
        label: 'Stock Price',
        data: mainDataPoints,
        borderColor: 'rgba(64,105,225,1)',
        backgroundColor: (context: any) => {
            const { chart } = context;
            const { ctx, chartArea } = chart;
            if (!chartArea) return undefined;
            return getGradient(ctx, chartArea);
        },
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        order: 3,
        z: 3,
    };

  // Dataset for transaction points (optional)
  const transactionsDataset = {
    label: 'Transactions',
    data: transactionDataPoints,
    showLine: false,
    pointRadius: 5,
    pointBackgroundColor: (ctx: any) => {
        if (!ctx.raw || !ctx.raw.x) {
            return 'gray';
        }
        const dateStr = ctx.raw.x; // the x date
        const idx = graphData.dates.indexOf(dateStr);
        const txInfo = transactionMap.get(idx);
        if (!txInfo) return 'gray';
        return txInfo.type === 'BUY'
            ? 'green'
            : txInfo.type === 'SELL'
            ? 'red'
            : 'gray';
    },
    order: 1,
    z: 1,
  };

    const datasets: any[] = [mainDataset, transactionsDataset];

    if (compareDataPoints.length > 0) {
        datasets.push({
            label: compareName,
            data: compareDataPoints,
            borderColor: 'rgb(255, 200, 0)',
            backgroundColor: 'rgb(255, 200, 0)',
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            order: 2,
            z: 2,
        });
    }

    const data = {
        datasets,
    };

    // Chart options
    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                display: true
            },
            tooltip: tooltipCallbacks,
        },
        interaction: {
            intersect: false,
            mode: 'nearest' as const,
            axis: 'x' as const,
        },
        scales: {
            x: {
                type: 'time' as const,
                time: {
                    unit: 'day',
                    tooltipFormat: 'MMM d, yyyy',
                    displayFormats: {
                        day: 'MMM d, yyyy'
                    },
                },
                adapters: {
                    date: {
                    // e.g., dayjs or luxon adapter
                    },
                },
            },
            y: { 
                type: 'linear' as const,
                ticks: {
                    callback: function (this: any, tickValue: string | number, index: number, ticks: any[]) {
                        const value = Number(tickValue);
                        const diff = ticks.length > 1 ? ticks[1].value - ticks[0].value : 1;
                        return diff < 1 ? value.toFixed(1) + '%' : value.toFixed(0) + '%';
                    }
                },
            },
        },
        elements: {
            line: {
                borderWidth: 1,
            },
        },
    };

    const containerStyle: React.CSSProperties = {
        color: '#000',
        backgroundColor: '#fff',
        width: '100%',
        height: '400px',
        boxSizing: 'border-box',
    };

    return (
        <div style={containerStyle}>
            <Line data={data} options={options} />
        </div>
    );
};

export default Graph;
