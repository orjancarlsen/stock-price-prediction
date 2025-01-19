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
  Filler
} from 'chart.js';
import { Transaction } from 'src/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

let previousChartArea: any;
let cachedGradient: CanvasGradient | undefined;

interface GraphProps {
  graphData: {
    dates: string[];
    prices: number[];
  };
  transactions?: Transaction[];
}

const Graph: React.FC<GraphProps> = ({ graphData, transactions }) => {
  const transactionMap = new Map<number, { realValue: number; type: string }>();

  (transactions || []).forEach(tx => {
    const dateStr = new Date(tx.timestamp).toISOString().split('T')[0];
    const dateIndex = graphData.dates.indexOf(dateStr);
    if (dateIndex !== -1) {
      // You could store multiple transactions per day if needed, or just overwrite
      transactionMap.set(dateIndex, {
        realValue: tx.price_per_share ?? 0,
        type: tx.transaction_type,
      });
    }
  });

  // Build an array of length == graphData.dates
  // If there's a transaction on that date, we put the line's price so the dot appears on the line
  // If not, we put null so no point is drawn
  const transactionData = graphData.dates.map((_, i) => {
    return transactionMap.has(i)
      ? graphData.prices[i] // Dot at this day's line price
      : null;              // No transaction dot this day
  });

  // Gradient background for the line
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

  // Tooltips
  const tooltipCallbacks = {
    callbacks: {
      label: function (context: any) {
        if (context.dataset.label === 'Transactions') {
          const idx = context.dataIndex;
          const txInfo = transactionMap.get(idx);
          
          if (txInfo) {
            const txLabel = txInfo.type === 'BUY' ? 'Kjøp' : txInfo.type === 'SELL' ? 'Salg' : txInfo.type === 'DIVIDEND' ? 'Utbytte' : 'Ukjent';
            return `${txLabel}: ${txInfo.realValue}`;
          }
          return ''; 
        }

        let label = '';
        if (context.parsed.y !== null) {
            const value = context.parsed.y;
            if (value >= 1000) {
                label = Math.round(value)
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            } else if (value >= 100) {
                label = value.toFixed(1);
            } else if (value >= 10) {
                label = value.toFixed(2);
            } else {
                label = value.toFixed(3);
            }
        }
        return `Kurs: ${label}`;
      },
    },
  };

  // Combine both "line" datasets
  const data = {
    labels: graphData.dates,
    datasets: [
      {
        label: 'Stock Price',
        data: graphData.prices, // pure number[]
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
        order: 2,
        z: 2,
      },
      {
        label: 'Transactions',
        data: transactionData,
        showLine: false,
        pointRadius: 5,   // bigger dots
        pointBackgroundColor: (ctx: any) => {
            const idx = ctx.dataIndex;
            const txInfo = transactionMap.get(idx);
            if (!txInfo) return 'gray';
            return txInfo.type === 'BUY' ? 'blue' : txInfo.type === 'SELL' ? 'red' : 'gray';
        },
        order: 1,
        z: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: tooltipCallbacks,
    },
    interaction: {
        intersect: false,
        mode: 'index' as const,
    },
    scales: {
        x: {
            type: 'category' as const,
        },
        y: {
            type: 'linear' as const,
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
