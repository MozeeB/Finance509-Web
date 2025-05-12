"use client";

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { formatCurrency } from '@/utils/format';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

// Define the data type for category data
export type CategoryData = {
  category: string;
  amount: number;
};

interface ExpenseCategoriesChartProps {
  data: CategoryData[];
}

export function ExpenseCategoriesChart({ data }: ExpenseCategoriesChartProps) {
  // Generate colors using the mint theme palette
  const generateColors = (count: number) => {
    // Mint-inspired color palette from the app's CSS variables
    const baseColors = [
      'hsl(var(--chart-1) / 0.85)', // Mint primary
      'hsl(var(--chart-2) / 0.85)', // Teal
      'hsl(var(--chart-3) / 0.85)', // Light green
      'hsl(var(--chart-4) / 0.85)', // Sky blue
      'hsl(var(--chart-5) / 0.85)', // Forest green
      'hsl(var(--income) / 0.85)',  // Income color
      'hsl(var(--expense) / 0.85)', // Expense color
      'hsl(190, 95%, 50%, 0.85)',   // Cyan
      'hsl(45, 93%, 47%, 0.85)',     // Yellow
      'hsl(275, 80%, 60%, 0.85)',    // Purple
    ];
    
    // Generate hover colors (slightly more vibrant)
    const hoverColors = baseColors.map(color => {
      // Make the color more vibrant by increasing opacity
      return color.replace('0.85', '1');
    });
    
    // If we have more categories than base colors, generate additional colors
    const colors = [...baseColors];
    const hovers = [...hoverColors];
    
    if (count > baseColors.length) {
      for (let i = baseColors.length; i < count; i++) {
        // Use golden ratio to spread colors evenly around the color wheel
        const hue = (i * 137.5) % 360;
        colors.push(`hsl(${hue}, 85%, 55%, 0.85)`);
        hovers.push(`hsl(${hue}, 85%, 55%, 1)`);
      }
    }
    
    return { 
      backgroundColor: colors.slice(0, count),
      hoverBackgroundColor: hovers.slice(0, count)
    };
  };

  // Chart options with improved styling
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%', // Creates a donut chart with a larger hole
    plugins: {
      legend: {
        position: 'right' as const,
        align: 'center' as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
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
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.raw !== null) {
              label += formatCurrency(context.raw);
              // Add percentage
              const total = context.chart.data.datasets[0].data.reduce((sum: number, val: number) => sum + val, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              label += ` (${percentage}%)`;
            }
            return label;
          }
        }
      }
    },
    // Add animation
    animation: {
      animateScale: true,
      animateRotate: true
    },
  };

  // Get colors for the chart
  const colors = generateColors(data.length);
  
  // Prepare chart data with improved styling
  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        data: data.map(item => item.amount),
        backgroundColor: colors.backgroundColor,
        hoverBackgroundColor: colors.hoverBackgroundColor,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        offset: 4, // Add spacing between segments
      },
    ],
  };

  return (
    <div className="h-64 w-full">
      <Pie options={options} data={chartData} />
    </div>
  );
}
