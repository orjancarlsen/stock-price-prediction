import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';

// Register Chart.js modules
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

let previousChartArea: any;

interface GraphProps {
  historicCompanyPrices: {
    dates: string[];
    prices: number[];
  };
}

const Graph: React.FC<GraphProps> = ({ historicCompanyPrices }) => {
  console.log("Render Graph with data:", historicCompanyPrices);

  // Configuration for the gradient
  let cachedGradient: CanvasGradient | undefined;
  const getGradient = (ctx: CanvasRenderingContext2D, chartArea: any): CanvasGradient => {
    if (!cachedGradient || chartArea !== previousChartArea) {
      console.log("Render gradient");
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  
      // Gradients
      gradient.addColorStop(1, 'rgba(64, 105, 225, 0.8)'); // Strongest blue at the top
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Fully transparent below
  
      cachedGradient = gradient;
      previousChartArea = chartArea;
    }
    return cachedGradient;
  };
  const tooltipCallbacks = {
    callbacks: {
      label: function(context: any) {
        let label = '';
        if (context.parsed.y !== null) {
          label = Math.round(context.parsed.y).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        }
        return label;
      }
    }
  };

  const data = {
    labels: historicCompanyPrices.dates,
    datasets: [
      {
        // label: 'Stock Price',
        data: historicCompanyPrices.prices,
        borderColor: 'rgba(64, 105, 225, 1)',
        backgroundColor: function(context: any) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            // This case happens on initial chart load
            return undefined;
          }

          return getGradient(ctx, chartArea);
        
        },
        fill: true,
        tension: 0.1,
        pointRadius: 0, // Disable circles at data points
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Disable the legend display
      },
      tooltip: tooltipCallbacks,
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.2)',
          lineWidth: 1,
        },
        title: {
          display: true,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.2)',
          lineWidth: 1,
        },
        title: {
          display: true,
        },
        ticks: {
          callback: function(tickValue: string | number) {
            if (typeof tickValue === 'number') {
              return tickValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            }
            return tickValue;
          }
        },
      },
    },
  };
  
  const containerStyle: React.CSSProperties = {
    color: '#000',
    backgroundColor: 'rgb(255, 255, 255)',
    transition: '0.3s ease-in-out',
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
