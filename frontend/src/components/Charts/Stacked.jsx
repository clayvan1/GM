// src/components/Charts/StackedChart.jsx
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useStateContext } from '../../context/ContextProvider';

const StackedChart = ({ data }) => {
  const { currentMode } = useStateContext();

  if (!data || !data.length) return <p>No data to display</p>;

  // get all keys except the x axis
  const keys = Object.keys(data[0] || {}).filter((k) => k !== 'x');
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

  return (
    <div
      className="stacked-chart-container"
      style={{
        width: '100%',
        height: '100%',
        '--grid-color': currentMode === 'Dark' ? '#444' : '#ccc',
        '--axis-color': currentMode === 'Dark' ? '#eee' : '#333',
        '--tooltip-bg': currentMode === 'Dark' ? 'rgba(34,34,34,0.9)' : '#fff',
      }}
    >
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={data}
          layout="vertical" // ✅ vertical bars
          margin={{ top: 5, right: 50, left: 30, bottom: 20 }}
        >
          <CartesianGrid stroke="var(--grid-color)" />
          <XAxis type="number" stroke="var(--axis-color)" />
          <YAxis dataKey="x" type="category" stroke="var(--axis-color)" />
          <Tooltip wrapperStyle={{ backgroundColor: 'var(--tooltip-bg)' }} />
          <Legend />

          {keys.map((key, idx) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={colors[idx % colors.length]}
              name={key} // legend uses key name
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StackedChart;
