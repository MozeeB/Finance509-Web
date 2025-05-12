"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../../utils/format';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define the data type for monthly data
export type MonthlyChartData = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

interface MonthlyTrendChartProps {
  data: MonthlyChartData[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  // Get theme colors from CSS variables
  const getThemeColor = (cssVar: string, opacity: number = 1) => {
    // Get the CSS variable value from the document
    if (typeof document !== 'undefined') {
      const style = getComputedStyle(document.documentElement);
      const color = style.getPropertyValue(cssVar).trim();
      return `hsl(${color} / ${opacity})`;
    }
    return '';
  };

  // Chart options with improved styling
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'start' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif',
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
          family: 'Inter, system-ui, sans-serif',
        },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
          callback: function(value: any) {
            return formatCurrency(value);
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        border: {
          display: false,
        },
      }
    },
  };

  // Prepare chart data with mint styling colors
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Income',
        data: data.map(item => item.income),
        backgroundColor: 'hsl(var(--income) / 0.85)',
        borderRadius: 10, // More rounded corners matching mint style
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        hoverBackgroundColor: 'hsl(var(--income) / 1)',
      },
      {
        label: 'Expenses',
        data: data.map(item => item.expenses),
        backgroundColor: 'hsl(var(--expense) / 0.85)',
        borderRadius: 10, // More rounded corners matching mint style
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        hoverBackgroundColor: 'hsl(var(--expense) / 1)',
      },
      {
        label: 'Savings',
        data: data.map(item => item.savings),
        backgroundColor: 'hsl(var(--chart-2) / 0.85)', // Using chart-2 color from mint palette
        borderRadius: 10, // More rounded corners matching mint style
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        hoverBackgroundColor: 'hsl(var(--chart-2) / 1)',
      },
    ],
  };

  return (
    <div className="h-64 w-full">
      <Bar options={options} data={chartData} />
    </div>
  );
}
