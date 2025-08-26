// src/components/Charts/DonutChart.jsx
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
  title = '', // optional heading
}) => {
  const { currentMode } = useStateContext();
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042']; // customize as needed

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
      <ResponsiveContainer width="99%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="y"
            nameKey="x"
            innerRadius="40%"
            outerRadius="70%"
            paddingAngle={3}
            label={false} // remove floating labels
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          {legendVisibility && <Legend wrapperStyle={{ color: 'var(--legend-color)' }} />}
          <Tooltip wrapperStyle={{ backgroundColor: 'var(--tooltip-bg)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart;
