import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { formatCurrency } from '../utils/formatters';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register Chart.js components and plugins
Chart.register(...registerables, zoomPlugin);

const MonteCarloChart = ({ simulationData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [useLogScale, setUseLogScale] = useState(false);
  
  const createChart = useCallback(() => {
    if (!simulationData || !chartRef.current) return;
    
    const medianPath = simulationData.medianPath;
    const worstPath = simulationData.worstPath;
    const bestPath = simulationData.bestPath;
    const worstDrawdownPath = simulationData.worstDrawdownPath;
    const allPaths = simulationData.allPaths || [];
    
    // Clean up any existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    
    // Create labels (years)
    const years = medianPath.map((_, index) => `Year ${index}`);
    
    // Prepare datasets array - start with background paths
    const datasets = [];
    
    // Add background paths first so they're rendered behind the main lines
    if (allPaths && allPaths.length > 0) {
      // Add up to 200 paths max to prevent performance issues
      const sampleSize = Math.min(allPaths.length, 200);
      const step = Math.max(1, Math.floor(allPaths.length / sampleSize));
      
      for (let i = 0; i < allPaths.length; i += step) {
        if (datasets.length >= sampleSize) break;
        
        datasets.push({
          data: allPaths[i],
          borderColor: 'rgba(200, 200, 200, 0.15)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,
          fill: false,
          label: 'Simulation Path',
          // Hide from legend and tooltips
          hidden: false,
          showLine: true,
          spanGaps: true,
          // Don't include in legend or tooltips
          showInLegendAndTooltip: false
        });
      }
    }
    
    // Then add the main highlight lines
    datasets.push(
      {
        label: 'Median Case',
        data: medianPath,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        fill: false
      },
      {
        label: 'Worst Case',
        data: worstPath,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        fill: false
      },
      {
        label: 'Best Case',
        data: bestPath,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        fill: false
      },
      {
        label: 'Worst Drawdown Path',
        data: worstDrawdownPath,
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.1,
        fill: false
      }
    );
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            filter: function(tooltipItem) {
              // Only show tooltips for the main lines (not gray background lines)
              return !tooltipItem.dataset.hasOwnProperty('showInLegendAndTooltip') || 
                     tooltipItem.dataset.showInLegendAndTooltip !== false;
            },
            callbacks: {
              label: function(context) {
                // Don't show background lines in tooltip
                if (context.dataset.showInLegendAndTooltip === false) {
                  return null;
                }
                
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += formatCurrency(context.parsed.y);
                return label;
              }
            }
          },
          legend: {
            position: 'top',
            labels: {
              filter: function(legendItem, chartData) {
                // Only show main lines in legend (not gray background lines)
                return !chartData.datasets[legendItem.datasetIndex].hasOwnProperty('showInLegendAndTooltip') || 
                       chartData.datasets[legendItem.datasetIndex].showInLegendAndTooltip !== false;
              }
            }
          },
          title: {
            display: true,
            text: 'Investment Growth Projections'
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'xy',
              modifierKey: 'shift'
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'xy',
              drag: {
                enabled: true,
                backgroundColor: 'rgba(0, 255, 65, 0.1)',
                borderColor: 'rgba(54, 162, 235, 0.5)',
                borderWidth: 1
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Year'
            }
          },
          y: {
            display: true,
            type: useLogScale ? 'logarithmic' : 'linear',
            title: {
              display: true,
              text: 'Portfolio Value'
            },
            ticks: {
              callback: function(value) {
                return formatCurrency(value);
              }
            }
          }
        }
      }
    });
  }, [simulationData, useLogScale]);

  // Effect for initial chart creation and updates when data or scale changes
  useEffect(() => {
    createChart();
  }, [createChart]);
  
  // Handle toggling between linear and log scale
  const toggleScale = () => {
    setUseLogScale(!useLogScale);
  };
  
  // Handle resetting zoom
  const resetZoom = () => {
    if (chartInstance.current) {
      chartInstance.current.resetZoom();
    }
  };
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={toggleScale}
            className="px-3 py-1 glow-btn glow-btn-green text-sm rounded focus:outline-none"
          >
            {useLogScale ? 'Use Linear Scale' : 'Use Log Scale'}
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1 bg-surface-elevated text-txt-primary text-sm rounded hover:bg-surface-overlay border border-surface-border focus:outline-none"
          >
            Reset Zoom
          </button>
        </div>
        <div className="text-xs text-txt-secondary italic">
          Tip: Scroll to zoom, Shift+drag to pan
        </div>
      </div>

      <div className="relative border border-surface-border rounded-lg overflow-x-auto mx-auto" style={{ maxWidth: '700px' }}>
        <canvas ref={chartRef} style={{ height: '220px', width: '100%' }}></canvas>
      </div>

      <div className="mt-4 p-3 bg-surface-elevated rounded-lg border border-surface-border">
        <h4 className="text-sm font-medium text-txt-primary mb-2">Chart Legend:</h4>
        <ul className="text-xs text-txt-secondary space-y-1">
          <li><span className="inline-block w-3 h-3 mr-1 bg-terminal-cyan rounded-full"></span> <strong>Median Case:</strong> The middle outcome (50th percentile)</li>
          <li><span className="inline-block w-3 h-3 mr-1 bg-terminal-green rounded-full"></span> <strong>Best Case:</strong> Top 1% of outcomes</li>
          <li><span className="inline-block w-3 h-3 mr-1 bg-terminal-red rounded-full"></span> <strong>Worst Case:</strong> Bottom 1% of outcomes</li>
          <li><span className="inline-block w-3 h-3 mr-1 bg-terminal-amber rounded-full"></span> <strong>Worst Drawdown:</strong> The path with the largest market crash</li>
          <li><span className="inline-block w-3 h-3 mr-1 bg-surface-overlay rounded-full border border-surface-border"></span> <strong>Background Paths:</strong> Individual simulation paths showing overall variability</li>
        </ul>
        <p className="mt-2 text-xs text-txt-muted">All values shown are inflation-adjusted (real) returns. {useLogScale ? 'Using logarithmic scale to better compare growth rates.' : ''}</p>
      </div>
    </div>
  );
};

export default MonteCarloChart; 