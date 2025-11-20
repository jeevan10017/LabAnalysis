import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

// Helper function to calculate Pearson Correlation Coefficient
// Returns a value between -1 and 1 (we will map to 0-1 absolute dependency)
const calculateCorrelation = (xArray, yArray) => {
  const n = xArray.length;
  if (n !== yArray.length || n === 0) return 0;

  const sumX = xArray.reduce((a, b) => a + b, 0);
  const sumY = yArray.reduce((a, b) => a + b, 0);
  const sumXY = xArray.reduce((sum, x, i) => sum + x * yArray[i], 0);
  const sumX2 = xArray.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = yArray.reduce((sum, y) => sum + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
};

export default function HeatmapChart({ data, selectedVariables }) {
  // Calculate the matrix whenever data or selection changes
  const { zValues, xLabels, yLabels } = useMemo(() => {
    if (!selectedVariables || selectedVariables.length === 0) {
      return { zValues: [], xLabels: [], yLabels: [] };
    }

    // 1. Extract data columns for selected variables
    const columnsData = {};
    selectedVariables.forEach(key => {
      columnsData[key] = data.map(row => {
        const val = row[key];
        // Ensure we only use numbers
        return typeof val === 'number' ? val : 0; 
      });
    });

    // 2. Build the Correlation Matrix
    const matrix = [];
    
    // Loop for Y-axis (Rows)
    selectedVariables.forEach(yVar => {
      const row = [];
      // Loop for X-axis (Columns)
      selectedVariables.forEach(xVar => {
        if (xVar === yVar) {
          row.push(1); // Diagonal is always 1 (Correlation with self)
        } else {
          const corr = calculateCorrelation(columnsData[xVar], columnsData[yVar]);
          // User asked for dependency (0 to 1). 
          // We take absolute value because -0.9 is a strong dependency, just inverse.
          row.push(Math.abs(corr)); 
        }
      });
      matrix.push(row);
    });

    return { 
      zValues: matrix, 
      xLabels: selectedVariables, 
      yLabels: selectedVariables // Correlation matrix is symmetric
    };
  }, [data, selectedVariables]);

  if (selectedVariables.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Please select at least 2 variables to generate a correlation matrix.
      </div>
    );
  }

  return (
    <Plot
      data={[
        {
          z: zValues,
          x: xLabels,
          y: yLabels,
          type: 'heatmap',
          colorscale: 'Blues', // Light = Low, Dark = High (as requested)
          showscale: true,
          zmin: 0,
          zmax: 1,
          xgap: 2, // Small gap between boxes
          ygap: 2,
          hoverongaps: false,
          hovertemplate: 
            '<b>%{y}</b> vs <b>%{x}</b><br>' +
            'Dependency: %{z:.2f}<extra></extra>',
        },
      ]}
      layout={{
        title: 'Variable Dependency Matrix',
        autosize: true,
        xaxis: { 
          automargin: true, 
          tickangle: -45, // Angle labels if they are long
          side: 'bottom'
        },
        yaxis: { 
          automargin: true,
          autorange: 'reversed' // Standard matrix view (top-left to bottom-right)
        },
        margin: { t: 50, l: 100, r: 50, b: 100 }, // Add margin for labels
      }}
      useResizeHandler={true}
      style={{ width: '100%', height: '100%' }}
    />
  );
}