import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const ProfitLossChart = ({ data }) => {
  if (!data || !data.length) return null;

  const latestValue = data[data.length - 1].profitLoss;
  const isProfit = latestValue >= 0;
  const chartColor = isProfit ? "#4ade80" : "#f87171";

  return (
    <div style={{ position: "relative", width: "100%", height: "400px" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          fontWeight: "bold",
          color: chartColor,
          fontSize: 18,
          zIndex: 10,
        }}
      >
        {isProfit ? "Profit" : "Loss"}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 30, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} tick={false} domain={['dataMin', 'dataMax']} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#27272a",
              borderColor: "#52525b",
              borderRadius: "0.5rem",
            }}
            labelStyle={{ color: "#fafafa" }}
          />

          <Area type="monotone" dataKey="profitLoss" stroke="none" fill={chartColor} fillOpacity={0.2} />
          <Line
            type="monotone"
            dataKey="profitLoss"
            stroke={chartColor}
            strokeWidth={4}
            dot={false}
            isAnimationActive
            activeDot={{ r: 6 }}
            strokeLinecap="round"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfitLossChart;
