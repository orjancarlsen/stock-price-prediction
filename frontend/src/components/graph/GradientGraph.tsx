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
    ChartOptions,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Transaction } from 'src/types';
import { singleDecimal } from '../../utils';

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
    graphName: string;
    transactions?: Transaction[];
    compareData?: {
        dates: string[];
        prices: number[];
    };
    compareName: string;
    percentageVsValue: 'percentage' | 'value';
}

const Graph: React.FC<GraphProps> = ({
    graphData,
    graphName,
    transactions,
    compareData,
    compareName,
    percentageVsValue,
}) => {
    // For the main data we compute the percent change relative to the first datapoint.
    const mainBasePrice = graphData.prices[0];
    const mainPercentData = graphData.prices.map(
        (price) => ((price - mainBasePrice) / mainBasePrice) * 100
    );

    // For the index / compare data we compute the percent change relative to its first datapoint.
    let comparePercentData: number[] = [];
    if (compareData && compareData.dates && compareData.prices) {
        const indexBasePrice = compareData.prices[0];
        comparePercentData = compareData.prices.map(
            (price) => ((price - indexBasePrice) / indexBasePrice) * 100
        );
    }

    // Build a map of transactions based on date index.
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

    // For the main dataset, decide whether to use the raw value or the percent change.
    const mainDataPoints = graphData.dates.map((dateStr, i) => ({
        x: dateStr,
        y:
        percentageVsValue === 'percentage'
            ? mainPercentData[i]
            : graphData.prices[i],
    }));

    // For the compare dataset, we always calculate the percent change.
    // In "percentage" mode we simply use that percent value.
    // In "value" mode, we re-scale it so that the starting point is the same as mainBasePrice.
    // We also attach the raw compare price (from compareData.prices) so that the tooltip can show it.
    const compareDataPoints =
        compareData && compareData.dates
        ? compareData.dates.map((dateStr, i) => {
                const percent = comparePercentData[i];
                const rawValue = compareData.prices[i];
                return {
                    x: dateStr,
                    y:
                    percentageVsValue === 'percentage'
                        ? percent
                        : mainBasePrice * (1 + percent / 100),
                    rawValue, // save the actual index price for the tooltip
                };
            })
        : [];

    // Similarly update the transaction points using the current mode.
    const transactionDataPoints = graphData.dates
        .map((dateStr, i) => {
            if (!transactionMap.has(i)) return null;
            return {
                x: dateStr,
                y:
                percentageVsValue === 'percentage'
                    ? mainPercentData[i]
                    : graphData.prices[i],
            };
        })
        .filter((pt): pt is { x: string; y: number } => pt !== null);

    // ----- Gradient for main line fill -----
    const getGradient = (
        ctx: CanvasRenderingContext2D,
        chartArea: { top: number; bottom: number }
    ) => {
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
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`; // e.g. "2025-01-21"
    }

    function formatValue(value: number, differentiator: number): string {
        if (differentiator >= 1) {
            return singleDecimal(value, 0);
        } else if (differentiator >= 0.1) {
            return singleDecimal(value, 1);
        } else {
            return singleDecimal(value, 2);
        }
    }

    // ----- Tooltip handling -----
    const tooltipCallbacks = {
        callbacks: {
            label: function (context: any) {
                const datasetLabel = context.dataset.label;
                const value = context.parsed.y;

                // For transaction points, we want to show the real value from the transaction.
                if (datasetLabel === 'Transactions') {
                    const rawX = context.parsed.x; // e.g. timestamp or date string
                    const dateObj = new Date(rawX);
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
                    return `${txLabel}: ${parseFloat(txInfo.realValue.toFixed(2))}`;
                }

                // For the compare dataset, show the raw (real) index value if available.
                if (datasetLabel === compareName) {
                    const rawValue = context.raw && context.raw.rawValue;
                    if (percentageVsValue === 'percentage') {
                        return `${datasetLabel}: ${value.toFixed(2)}%`;
                    }
                    return `${datasetLabel}: ${formatValue(rawValue, rawValue/1000)}`;
                }

                if (datasetLabel === graphName) {
                    if (percentageVsValue === 'percentage') {
                        return `${datasetLabel}: ${value.toFixed(2)}%`;
                    }
                    return `${datasetLabel}: ${formatValue(value, value/1000)}`;
                }

                return '';
            },
        },
        itemSort: (a: any, b: any) => {
            // Define the desired order.
            const order = {
                'Transactions': 1,
                [graphName]: 2,
                [compareName]: 3,
            };
    
            // Any dataset not explicitly defined will get a higher order number (e.g. 99)
            const orderA = order[a.dataset.label] || 99;
            const orderB = order[b.dataset.label] || 99;
            return orderA - orderB;
        },
    };

    // ----- Build datasets -----
    const mainDataset = {
        label: graphName,
        data: mainDataPoints,
        borderColor: 'rgba(64,105,225,1)',
        backgroundColor: (context: any) => {
            const { chart } = context;
            const { ctx, chartArea } = chart;
            if (!chartArea) return undefined;
            return getGradient(ctx, chartArea);
        },
        fill: 'start',
        tension: 0.1,
        pointRadius: 0,
        order: 3,
        z: 3,
    };

    const transactionsDataset = {
        label: 'Transactions',
        data: transactionDataPoints,
        showLine: false,
        pointRadius: 5,
        pointBackgroundColor: (ctx: any) => {
            if (!ctx.raw || !ctx.raw.x) {
                return 'gray';
            }
            const dateStr = ctx.raw.x;
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

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
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
                        day: 'MMM d, yyyy',
                    },
                },
            },
            y: {
                type: 'linear' as const,
                ticks: {
                    callback: function (
                        tickValue: string | number,
                        index: number,
                        ticks: any[]
                    ) {
                        const tickDifference = Math.abs(ticks[1].value - ticks[0].value);
                        const value = formatValue(Number(tickValue), tickDifference);
                        
                        if (percentageVsValue === 'percentage') {
                            return value + '%';
                        } else {
                            return value + ' NOK';
                        }
                    },
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
