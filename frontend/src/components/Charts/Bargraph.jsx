// src/components/Charts/BarChartBox.jsx
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const BarChartBox = ({
  id,
  data = [],
  width = '100%',
  height = 300, // fixed default height
  color = '#4F46E5',
  xKey = 'label',
  yKey = 'value',
}) => {
  // Filter and clean data
  const cleanData = data
    .filter(item => typeof item === 'object' && item[xKey] != null && item[yKey] != null)
    .map(item => ({
      [xKey]: item[xKey],
      [yKey]: Number(item[yKey]),
    }))
    .filter(item => !isNaN(item[yKey]));

  if (cleanData.length === 0) {
    return (
      <div
        id={id}
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #ddd',
          borderRadius: 4,
        }}
      >
        No data
      </div>
    );
  }

  return (
    <div id={id} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={cleanData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
          <XAxis dataKey={xKey} axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartBox;
