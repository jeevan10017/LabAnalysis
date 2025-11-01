import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// New theme colors
const COLORS = [
  '#00796B', // primary
  '#d32f2f', // red
  '#388E3C', // green
  '#F57C00', // orange
  '#7B1FA2', // purple
];

export function DynamicChart({ data, xAxisKey, yAxisKeys = [] }) {
  if (!xAxisKey || yAxisKeys.length === 0 || !data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-secondary-dark">
        {(!data || data.length === 0)
          ? "No data to display."
          : "Please select an X-axis and at least one Y-axis to plot."
        }
      </div>
    );
  }
  
  // Create a combined Y-axis label
  const yAxisLabel = yAxisKeys.join(', ');

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: 30, // Increased left margin for Y-axis label
          bottom: 30, // Increased bottom margin for X-axis label
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
        
        {/* FIX: X-Axis label moved outside to prevent overlap */}
        <XAxis 
          dataKey={xAxisKey} 
          label={{ 
            value: xAxisKey, 
            position: 'bottom', // Moves label outside chart
            offset: 0,
            dy: 20, // Pushes it down
            fill: '#616161', 
            fontSize: 14 
          }} 
          type="number" 
          domain={['dataMin', 'dataMax']}
          stroke="#616161"
          tick={{ fontSize: 12 }}
        />
        
        {/* FIX: Y-axis label added */}
        <YAxis 
          stroke="#616161"
          tick={{ fontSize: 12 }}
          label={{
            value: yAxisLabel,
            angle: -90,
            position: 'insideLeft',
            fill: '#616161',
            fontSize: 14,
            dx: -25 // Adjust distance from axis
          }}
        />
        
        <Tooltip />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        {yAxisKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            activeDot={{ r: 6 }}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}