// src/components/Charts/SparkLine.jsx
import React from 'react';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import './LineChart'; // If you're sharing styles across charts

const SparkLine = ({
  id,
  data = [],
  width = '100%',
  height = '100%',
  color = '#8884d8'
}) => {
  const cleanData = data
    .map(item =>
      typeof item === 'object' && item.yval != null
        ? Number(item.yval)
        : Number(item)
    )
    .filter(v => !isNaN(v));

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
        }}
      >
        No data
      </div>
    );
  }

  return (
    <div
      id={id}
      className="sparkline-container"
      style={{ width, height }}
    >
      <Sparklines data={cleanData} width={100} height={40} margin={5}>
        <SparklinesLine
          style={{ stroke: color, fill: 'none', strokeWidth: 2 }}
        />
        <SparklinesSpots size={4} style={{ stroke: color, fill: color }} />
      </Sparklines>
    </div>
  );
};

export default SparkLine;
