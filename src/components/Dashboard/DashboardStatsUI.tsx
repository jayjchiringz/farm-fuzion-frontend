import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Type Definitions
interface StatusPieProps {
  data: { label: string; value: number }[];
}

interface OverviewStatsProps {
  totalGroups: number;
  totalFarmers: number;
}

interface GroupStatsProps {
  statusCounts: Record<string, number>;
}

interface FarmerStatsProps {
  farmerByGroup: { group: string; total: number }[];
}

const COLORS = ["#8dc71d", "#0d5b10", "#facc15", "#ef4444"];

const StatusPie: React.FC<StatusPieProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="label"
        outerRadius={60}
        label
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);

const OverviewStats: React.FC<OverviewStatsProps> = ({ totalGroups, totalFarmers }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
    <div className="bg-brand-green dark:bg-brand-apple p-4 rounded-xl text-white dark:text-brand-dark shadow">
      <p className="text-sm font-medium">Total Groups</p>
      <p className="text-2xl font-bold">{totalGroups}</p>
    </div>
    <div className="bg-brand-green dark:bg-brand-apple p-4 rounded-xl text-white dark:text-brand-dark shadow">
      <p className="text-sm font-medium">Total Farmers</p>
      <p className="text-2xl font-bold">{totalFarmers}</p>
    </div>
  </div>
);

const GroupStats: React.FC<GroupStatsProps> = ({ statusCounts }) => {
  const chartData = Object.entries(statusCounts).map(([label, value]) => ({
    label,
    value,
  }));

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-brand-apple">
        Group Status Summary
      </h3>
      <StatusPie data={chartData} />
    </div>
  );
};

const FarmerStats: React.FC<FarmerStatsProps> = ({ farmerByGroup }) => {
  const chartData = farmerByGroup.map((item) => ({
    name: item.group,
    count: item.total,
  }));

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-brand-apple">
        Farmers per Group
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8dc71d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export { OverviewStats, GroupStats, FarmerStats };
