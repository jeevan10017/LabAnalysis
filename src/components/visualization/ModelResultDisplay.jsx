import React from 'react';
import Plot from 'react-plotly.js';

export default function ModelResultDisplay({ results, independentVars, dependentVars }) {
  const { r_squared, predictions, coefficients } = results;

  // Use the first dependent variable for the plot
  const plotVar = dependentVars[0];
  const plotData = predictions.map(p => ({
    actual: p.actual[plotVar],
    predicted: p.predicted[plotVar],
  }));

  return (
    <div className="space-y-6">
      {/* 1. Key Metrics */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800">Model Results</h3>
        <div className="mt-4">
          <span className="text-lg text-secondary-dark">R-Squared Score:</span>
          <span className="ml-2 text-3xl font-bold text-primary-dark">
            {r_squared.toFixed(3)}
          </span>
          <p className="text-sm text-secondary-dark mt-1">
            This score indicates that { (r_squared * 100).toFixed(1) }% of the variance in the dependent variable(s) can be predicted by the independent variable(s).
          </p>
        </div>
      </div>

      {/* 2. Coefficients Table */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Model Coefficients</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-DEFAULT">
            <thead className="bg-secondary-light">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Dependent Variable</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Independent Variable</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Coefficient</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-light bg-white">
              {Object.entries(coefficients).map(([depVar, coeffs]) => (
                Object.entries(coeffs).map(([indepVar, coeff], index) => (
                  <tr key={`${depVar}-${indepVar}`} className="hover:bg-secondary-light/50">
                    {index === 0 && (
                      <td rowSpan={Object.keys(coeffs).length} className="px-6 py-4 text-sm font-medium text-gray-900 align-top">{depVar}</td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-700">{indepVar}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">{coeff.toFixed(4)}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Prediction Plot */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Actual vs. Predicted Plot (for {plotVar})
        </h3>
        <div className="w-full aspect-video">
          <Plot
            data={[
              // Scatter plot of actual vs. predicted
              {
                x: plotData.map(p => p.actual),
                y: plotData.map(p => p.predicted),
                mode: 'markers',
                type: 'scatter',
                name: 'Predictions',
                marker: { color: '#00796B' }, // Primary color
              },
              // Ideal 45-degree line (x=y)
              {
                x: [Math.min(...plotData.map(p => p.actual)), Math.max(...plotData.map(p => p.actual))],
                y: [Math.min(...plotData.map(p => p.actual)), Math.max(...plotData.map(p => p.actual))],
                mode: 'lines',
                type: 'scatter',
                name: 'Ideal Fit (x=y)',
                line: { color: '#d32f2f', dash: 'dash' },
              },
            ]}
            layout={{
              title: `Model Performance for ${plotVar}`,
              xaxis: { title: `Actual ${plotVar}` },
              yaxis: { title: `Predicted ${plotVar}` },
              autosize: true,
              hovermode: 'closest',
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}