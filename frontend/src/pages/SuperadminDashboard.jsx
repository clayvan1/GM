// src/pages/SuperadminDashboard.jsx
import React, { useState, useEffect } from "react";
import { getInventories } from "../Service/InventoryService";

// Charts
import LineChart from "../components/Charts/LineChart";
import SparkLine from "../components/Charts/SparkLine";
import ProfitLossChart from "../components/Charts/ProfitLossChart";
import BarChartBox from "../components/Charts/Bargraph";
import DonutChart from "../components/Charts/Pie";
import "./SuperadminDashboard.css";

function SuperadminDashboard() {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------
  // Fetch Inventory Data from API
  // ------------------------------
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

  const safeInventoryData = inventoryData.length ? inventoryData : [];

  // ------------------------------
  // Summary Cards
  // ------------------------------
  const totalGrams = safeInventoryData.reduce(
    (sum, inv) => sum + (inv.grams_available || 0),
    0
  );
  const totalJoints = safeInventoryData.reduce(
    (sum, inv) =>
      sum + inv.joints.reduce((jSum, j) => jSum + (j.joints_count || 0), 0),
    0
  );
  const totalSalesAmount = safeInventoryData.reduce(
    (sum, inv) =>
      sum + inv.sales.reduce((sSum, s) => sSum + (s.total_price || 0), 0),
    0
  );
  const totalSalesCount = safeInventoryData.reduce(
    (sum, inv) =>
      sum + inv.sales.reduce((sSum, s) => sSum + (s.quantity || 0), 0),
    0
  );

  const earningData = [
    {
      title: "Total Grams",
      amount: totalGrams,
      icon: "🧪",
      iconColor: "#03C9D7",
      iconBg: "#E5FAFB",
    },
    {
      title: "Total Joints",
      amount: totalJoints,
      icon: "💨",
      iconColor: "#7352FF",
      iconBg: "#EAE8FD",
    },
    {
      title: "Total Sales (Ksh)",
      amount: totalSalesAmount,
      icon: "💰",
      iconColor: "#FF5C8E",
      iconBg: "#FDE8EF",
    },
    {
      title: "Total Joints Sold",
      amount: totalSalesCount,
      icon: "📈",
      iconColor: "#FFA500",
      iconBg: "#FFF4E5",
    },
  ];

  // ------------------------------
  // Global Profit/Loss Per Day
  // ------------------------------
  const dayMap = {};
  safeInventoryData.forEach((inv) => {
    const totalGramsInInventory = inv.joints.reduce(
      (sum, j) => sum + (j.grams_used || 0),
      0
    );
    const inventoryBuyingPrice = inv.buying_price || 0;

    inv.sales.forEach((sale) => {
      const date = new Date(sale.created_at).toLocaleDateString();
      if (!dayMap[date]) dayMap[date] = 0;

      const revenue = sale.total_price || 0;
      const gramsUsedInSale = sale.quantity || 0;
      const proportionBuyingPrice =
        totalGramsInInventory > 0
          ? (gramsUsedInSale / totalGramsInInventory) * inventoryBuyingPrice
          : 0;

      dayMap[date] += revenue - proportionBuyingPrice;
    });
  });

  const sortedDates = Object.keys(dayMap).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  const profitLossData = sortedDates.map((date) => ({
    date,
    profitLoss: dayMap[date],
  }));

  // ------------------------------
  // Sales Trend (Orders) per Day
  // ------------------------------
  const salesTrendMap = {};
  safeInventoryData.forEach((inv) => {
    inv.sales.forEach((sale) => {
      const date = new Date(sale.created_at).toLocaleDateString();
      if (!salesTrendMap[date]) salesTrendMap[date] = 0;
      salesTrendMap[date] += 1;
    });
  });

  const salesTrendData = Object.keys(salesTrendMap)
    .sort((a, b) => new Date(a) - new Date(b))
    .map((date) => ({ date, count: salesTrendMap[date] }));

  // ------------------------------
  // Other Charts
  // ------------------------------
  const SparklineAreaData = safeInventoryData.map((inv, idx) => ({
    x: idx + 1,
    yval: inv.sales.reduce((sum, s) => sum + (s.total_price || 0), 0),
  }));

  const pieSourceData = safeInventoryData.map((inv) => ({
    x: inv.strain_name,
    y: inv.grams_available || 0,
    text: `${inv.grams_available || 0} g`,
  }));

  const sortedPieData = [...pieSourceData].sort((a, b) => b.y - a.y);
  const topSix = sortedPieData.slice(0, 6);
  const others = sortedPieData.slice(6);

  const ecomPieChartData =
    others.length > 0
      ? [
          ...topSix,
          {
            x: "Others",
            y: others.reduce((sum, item) => sum + item.y, 0),
            text: `${others.reduce((sum, item) => sum + item.y, 0)} g`,
          },
        ]
      : topSix;

  const barChartData = safeInventoryData.map((inv) => ({
    label: inv.strain_name,
    value: inv.sales.reduce((sum, s) => sum + (s.quantity || 0), 0),
  }));

  // ------------------------------
  // FALLBACKS
  // ------------------------------
  const fallbackLine = [{ date: "No Data", count: 0 }];
  const fallbackProfitLoss = [{ date: "No Data", profitLoss: 0 }];
  const fallbackSparkline = [{ x: 0, yval: 0 }];
  const fallbackPie = [{ x: "No Data", y: 1, text: "0 g" }];
  const fallbackBar = [{ label: "No Data", value: 0 }];

  if (loading)
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );

  // ------------------------------
  return (
    <div className="dash">
      <div className="dashboard-grid-container">
        {/* Left Column */}
        <div className="left-col">
          <div className="realtime-graph">
            <h3 className="graph-heading">Profit / Loss Over Time</h3>
            <ProfitLossChart
              data={profitLossData.length ? profitLossData : fallbackProfitLoss}
            />
          </div>

          <div className="dashboard-card">
            <p className="card-title-lg">Revenue Updates</p>
            <SparkLine
              id="sparkline"
              type="Line"
              height="70%"
              width="100%"
              data={SparklineAreaData.length ? SparklineAreaData : fallbackSparkline}
            />
          </div>
        </div>

        {/* Center Column */}
        <div className="center-col">
          <div className="summary-cards-grid">
            {earningData.map((item, idx) => (
              <div key={idx} className="dashboard-card summary-card">
                <button
                  style={{
                    color: item.iconColor,
                    backgroundColor: item.iconBg,
                  }}
                  className="card-icon"
                >
                  {item.icon}
                </button>
                <div>
                  <p className="card-amount">{item.amount}</p>
                  <p className="card-title">{item.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-card line-chart-card graph-card">
            <h3 className="graph-heading">Order Trend Over Time</h3>
            <LineChart
              data={salesTrendData.length ? salesTrendData : fallbackLine}
              xKey="date"
              yKey="count"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="right-col">
          <div className="dashboard-card">
            <h3 className="graph-heading">Inventory Size by Strain</h3>
            <DonutChart
              id="doughnut-chart"
              data={ecomPieChartData.length ? ecomPieChartData : fallbackPie}
              legendVisibility={true}
              height="300px"
            />
          </div>

          <div className="dashboard-card">
            <h3 className="graph-heading">Sales Count by Strain</h3>
            <BarChartBox
              data={barChartData.length ? barChartData : fallbackBar}
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
