import React from 'react';
import Plot from 'react-plotly.js';

export default function HeatmapChart({ data, xVar, yVar, zVar }) {
  const xData = data.map(row => row[xVar]);
  const yData = data.map(row => row[yVar]);
  const zData = data.map(row => row[zVar]);

  return (
    <Plot
      data={[
        {
          x: xData,
          y: yData,
          z: zData,
          type: 'contour',
          contours_coloring: 'heatmap',
          connectgaps: true,
          colorscale: 'Viridis',
          showscale: true,
          line: {
            width: 0,
          },
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