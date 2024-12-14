import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';

// Register Chart.js modules
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

let previousChartArea;

const Graph = () => {
  console.log("Render Graph")

  // Configuration for the gradient
  let cachedGradient;
  const getGradient = (ctx, chartArea) => {
    if (!cachedGradient || chartArea !== previousChartArea) {
      console.log("Render gradient");
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, 'rgba(64, 105, 225, 0)');
      gradient.addColorStop(0.3, 'rgba(64, 105, 225, 0.4)');
      gradient.addColorStop(0.75, 'rgba(64, 105, 225, 0.3)');
      gradient.addColorStop(0.95, 'rgba(64, 105, 225, 0.2)');
      cachedGradient = gradient;
      previousChartArea = chartArea;
    }
    return cachedGradient;
  };
  
  // Chart data
  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Stock Price',
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: 'rgba(64, 105, 225, 1)',
        backgroundColor: function(context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            // This case happens on initial chart load
            return null;
          }
          return getGradient(ctx, chartArea);
        },
        fill: true,
        tension: 0.1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    scales: {
      x: {
        title: {
          display: true
        }
      },
      y: {
        title: {
          display: true
        }
      }
    }
  };

  const containerStyle = {
    color: '#000',
    backgroundColor: 'rgb(255, 255, 255)',
    padding: '1rem',
    transition: '0.3s ease-in-out',
    width: '100%',
    height: '400px',
    boxSizing: 'border-box',
  };

  return (
    <div style={containerStyle}>
      <h1>Stock Price Changes</h1>
      <Line data={data} options={options} />
    </div>
  );
};

export default Graph;