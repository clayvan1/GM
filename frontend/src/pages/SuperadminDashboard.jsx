import React, { useState, useEffect } from "react";
import { getInventories } from "../Service/InventoryService";

// Charts
import LineChart from "../components/Charts/LineChart";
import Doughnut from "../components/Charts/Pie";
import SparkLine from "../components/Charts/SparkLine";
import ProfitLossChart from "../components/Charts/ProfitLossChart";
import BarChartBox from "../components/Charts/Bargraph";

import "./SuperadminDashboard.css";

function SuperadminDashboard() {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const inventories = await getInventories();
        setInventoryData(inventories);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const safeInventoryData = inventoryData.length
    ? inventoryData
    : [
        {
          strain_name: "None",
          grams_available: 0,
          price_per_gram: 0,
          joints: [],
          sales: [],
          buying_price: 0,
        },
      ];

  // ------------------------------
  // Earning data for cards
  // ------------------------------
  const earningData = [
    {
      title: "Total Grams",
      amount: safeInventoryData.reduce((sum, inv) => sum + (inv.grams_available || 0), 0),
      percentage: "+0%",
      icon: <span>🧪</span>,
      iconColor: "#03C9D7",
      iconBg: "#E5FAFB",
      pcColor: "green-500",
    },
    {
      title: "Total Joints",
      amount: safeInventoryData.reduce(
        (sum, inv) =>
          sum + inv.joints.reduce((jSum, j) => jSum + (j.joints_count || 0), 0),
        0
      ),
      percentage: "+0%",
      icon: <span>💨</span>,
      iconColor: "#7352FF",
      iconBg: "#EAE8FD",
      pcColor: "green-500",
    },
    {
      title: "Total Sales",
      amount: safeInventoryData.reduce(
        (sum, inv) =>
          sum + inv.sales.reduce((sSum, s) => sSum + (s.total_price || 0), 0),
        0
      ),
      percentage: "+0%",
      icon: <span>💰</span>,
      iconColor: "#FF5C8E",
      iconBg: "#FDE8EF",
      pcColor: "green-500",
    },
    {
      title: "Avg Price/Gram",
      amount: (
        safeInventoryData.reduce((sum, inv) => sum + (inv.price_per_gram || 0), 0) /
        safeInventoryData.length
      ).toFixed(2),
      percentage: "+0%",
      icon: <span>⚖️</span>,
      iconColor: "#1E4DB7",
      iconBg: "#E5ECF9",
      pcColor: "green-500",
    },
  ];

  // ------------------------------
  // Profit/Loss over time (daily)
  // ------------------------------
  const dayMap = {};

  safeInventoryData.forEach((inv) => {
    const totalGramsUsed = inv.joints.reduce((sum, j) => sum + (j.grams_used || 0), 0);
    const costPerGram = totalGramsUsed > 0 ? inv.buying_price / totalGramsUsed : 0;

    inv.sales.forEach((sale) => {
      const date = new Date(sale.created_at).toLocaleDateString();
      if (!dayMap[date]) dayMap[date] = { profit: 0, loss: 0 };

      const gramsUsed = sale.quantity || 0;
      const cost = gramsUsed * costPerGram;
      const revenue = sale.total_price || 0;

      if (revenue >= cost) {
        dayMap[date].profit += revenue - cost;
      } else {
        dayMap[date].loss += cost - revenue;
      }
    });
  });

  const sortedDates = Object.keys(dayMap).sort((a, b) => new Date(a) - new Date(b));
  const profitLossData = sortedDates.map((date) => ({
    date,
    profitLoss: dayMap[date].profit - dayMap[date].loss, // positive = profit, negative = loss
  }));

  // ------------------------------
  // Other charts data
  // ------------------------------
  const SparklineAreaData = safeInventoryData.map((inv, index) => ({
    x: index + 1,
    yval: inv.sales.reduce((sum, s) => sum + (s.total_price || 0), 0),
  }));

  const ecomPieChartData = safeInventoryData.map((inv) => ({
    x: inv.strain_name,
    y: inv.grams_available || 0,
    text: `${inv.grams_available || 0} g`,
  }));

  const barChartData = safeInventoryData.map((inv) => ({
    label: inv.strain_name,
    value: inv.sales.length || 0,
  }));

  const salesTrendData = [];
  safeInventoryData.forEach((inv) => {
    inv.sales.forEach((sale) => {
      const date = new Date(sale.created_at).toLocaleDateString();
      const existing = salesTrendData.find((d) => d.date === date);
      if (existing) {
        existing.count += 1;
      } else {
        salesTrendData.push({ date, count: 1 });
      }
    });
  });
  salesTrendData.sort((a, b) => new Date(a.date) - new Date(b.date));

  // ------------------------------
  return (
    <div className="dash">
      <div className="dashboard-grid-container">
        {/* Left Column */}
        <div className="left-col">
          <div className="realtime-graph">
            <h3 className="graph-heading">Profit  Loss Over Time</h3>
            <ProfitLossChart data={profitLossData} />
          </div>

          <div className="dashboard-card">
            <p className="card-title-lg">Revenue Updates</p>
            <div className="card-body">
              <div className="card-finance">
                <div className="chart-spark">
                  <SparkLine
                    id="sparkline"
                    type="Line"
                    height="70%"
                    width="70%"
                    data={SparklineAreaData}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column */}
        <div className="center-col">
          <div className="summary-cards-grid">
            {earningData.map((item, index) => (
              <div key={index} className="dashboard-card summary-card">
                <button
                  type="button"
                  style={{ color: item.iconColor, backgroundColor: item.iconBg }}
                  className="card-icon"
                >
                  {item.icon}
                </button>
                <div>
                  <p className="card-amount">{item.amount}</p>
                  <p className={`card-percentage ${item.pcColor}`}>{item.percentage}</p>
                  <p className="card-title">{item.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-card line-chart-card graph-card">
            <h3 className="graph-heading">Order Trend Over Time</h3>
            <LineChart
              data={salesTrendData.length ? salesTrendData : [{ date: "None", count: 0 }]}
              xKey="date"
              yKey="count"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="right-col">
          <div className="dashboard-card">
            <h3 className="graph-heading">Inventory Size by Strain</h3>
            <Doughnut
              id="doughnut-chart"
              data={ecomPieChartData}
              legendVisiblity
              height="300px"
            />
          </div>

          <div className="dashboard-card">
            <h3 className="graph-heading">Sales Count by Strain</h3>
            <BarChartBox
              data={barChartData.length ? barChartData : [{ label: "None", value: 0 }]}
              xKey="label"
              yKey="value"
              height="300px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperadminDashboard;
