// src/components/Charts/LineChart.jsx
import React from 'react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useStateContext } from '../../context/ContextProvider';

const LineChart = ({ data, xKey, yKey }) => {
  const { currentMode } = useStateContext();

  if (!data || !data.length) return <p>No data to display</p>;

  return (
    <div
      className="line-chart-container"
      style={{
        width: '100%',
        height: '100%',
        '--grid-color': currentMode === 'Dark' ? '#444' : '#ccc',
        '--axis-color': currentMode === 'Dark' ? '#eee' : '#333',
        '--tooltip-bg': currentMode === 'Dark' ? 'rgba(34,34,34,0.9)' : '#fff',
      }}
    >
      <ResponsiveContainer width="100%" height="80%">
        <RechartsLineChart data={data} margin={{ top: 15, right: 10, bottom: 5 }}>
          <CartesianGrid stroke="var(--grid-color)" />
          <XAxis dataKey={xKey} stroke="var(--axis-color)" />
          <YAxis stroke="var(--axis-color)" />
          <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)' }} />
          <Legend />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
