import React from 'react';
import Plot from 'react-plotly.js';

export default function HeatmapChart({ data, xVar, yVar, zVar }) {
  // Plotly heatmaps need sorted, unique X and Y axes, and a 2D array for Z
  
  // 1. Get unique, sorted X and Y values
  const xVals = [...new Set(data.map(row => row[xVar]))].sort((a, b) => a - b);
  const yVals = [...new Set(data.map(row => row[yVar]))].sort((a, b) => a - b);

  // 2. Create a lookup map for fast Z-value retrieval
  const dataMap = new Map();
  data.forEach(row => {
    dataMap.set(`${row[xVar]}_${row[yVar]}`, row[zVar]);
  });

  // 3. Build the 2D Z-array
  const zVals = yVals.map(y => {
    return xVals.map(x => {
      return dataMap.get(`${x}_${y}`) || null; // Use null for missing data points
    });
  });

  return (
    <Plot
      data={[
        {
          x: xVals,
          y: yVals,
          z: zVals,
          type: 'heatmap',
          colorscale: 'Viridis', // A common scientific color scale
          showscale: true,
        },
      ]}
      layout={{
        title: `${zVar} vs. ${xVar} and ${yVar}`,
        xaxis: { title: xVar, automargin: true },
        yaxis: { title: yVar, automargin: true },
        autosize: true,
      }}
      useResizeHandler={true}
      style={{ width: '100%', height: '100%' }}
    />
  );
}