import React from 'react';
import './LineChart.css';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { useStateContext } from '../../context/ContextProvider';

const DonutChart = ({
  id,
  data = [],
  legendVisibility = true,
  height = '400px',
  title = '',
}) => {
  const { currentMode } = useStateContext();
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#FF5C8E', '#03C9D7'];

  // Ensure y values are numbers
  const chartData = data.map(item => ({
    ...item,
    y: Number(item.y) || 0,
  }));

  return (
    <div
      id={id}
      className="donut-chart-container"
      style={{
        height,
        '--tooltip-bg': currentMode === 'Dark' ? '#222' : '#fff',
        '--legend-color': currentMode === 'Dark' ? '#eee' : '#333'
      }}
    >
      {title && <h3 className="graph-heading">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="y"
            nameKey="x"
            innerRadius="40%"
            outerRadius="90%"
            paddingAngle={3}
            label={false}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          {legendVisibility && (
            <Legend wrapperStyle={{ color: 'var(--legend-color)' }} />
          )}
          <Tooltip wrapperStyle={{ backgroundColor: 'var(--tooltip-bg)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart;
