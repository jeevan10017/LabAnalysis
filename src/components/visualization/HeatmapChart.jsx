import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

// Helper function to calculate Pearson Correlation Coefficient
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
  const { zValues, xLabels, yLabels } = useMemo(() => {
    if (!selectedVariables || selectedVariables.length === 0) {
      return { zValues: [], xLabels: [], yLabels: [] };
    }

    const columnsData = {};
    selectedVariables.forEach(key => {
      columnsData[key] = data.map(row => {
        const val = row[key];
        return typeof val === 'number' ? val : 0; 
      });
    });

    const matrix = [];
    
    selectedVariables.forEach(yVar => {
      const row = [];
      selectedVariables.forEach(xVar => {
        if (xVar === yVar) {
          row.push(1); 
        } else {
          const corr = calculateCorrelation(columnsData[xVar], columnsData[yVar]);
          row.push(Math.abs(corr)); 
        }
      });
      matrix.push(row);
    });

    return { 
      zValues: matrix, 
      xLabels: selectedVariables, 
      yLabels: selectedVariables 
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
          // 'Viridis' is the modern scientific standard (Purple -> Yellow)
          // Other professional options: 'Magma', 'Plasma', 'Inferno'
          colorscale: 'Viridis', 
          showscale: true,
          zmin: 0,
          zmax: 1,
          xgap: 1,
          ygap: 1,
          hoverongaps: false,
          hovertemplate: 
            '<b>%{y}</b> vs <b>%{x}</b><br>' +
            'Dependency: %{z:.2f}<extra></extra>',
        },
      ]}
      layout={{
        title: {
          text: 'Variable Dependency Matrix',
          font: { size: 18, color: '#333' }
        },
        autosize: true,
        xaxis: { 
          automargin: true, 
          tickangle: -45,
          side: 'bottom'
        },
        yaxis: { 
          automargin: true,
          autorange: 'reversed' 
        },
        margin: { t: 60, l: 100, r: 50, b: 100 },
      }}
      useResizeHandler={true}
      style={{ width: '100%', height: '100%' }}
    />
  );
}