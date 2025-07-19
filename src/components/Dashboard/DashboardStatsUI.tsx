import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Users, UsersRound } from "lucide-react";

const COLORS = ["#8dc71d", "#0d5b10", "#facc15", "#ef4444"];

interface StatusDataItem {
  label: string;
  value: number;
}

interface FarmerGroupData {
  group: string;
  total: number;
}

interface OverviewStatsProps {
  totalGroups: number;
  totalFarmers: number;
}

interface GroupStatsProps {
  statusCounts: Record<string, number>;
}

interface FarmerStatsProps {
  farmerByGroup: FarmerGroupData[];
}

const StatusPie = ({ data }: { data: StatusDataItem[] }) => (
  <ResponsiveContainer width="100%" height={180}>
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="label"
        outerRadius={60}
        innerRadius={30}
        labelLine={false}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend verticalAlign="bottom" height={36} iconType="circle" />
    </PieChart>
  </ResponsiveContainer>
);

// Compact total counters with icons
const OverviewStats = ({ totalGroups, totalFarmers }: OverviewStatsProps) => (
  <div className="flex flex-wrap gap-4 mb-8">
    <div className="flex items-center bg-brand-green dark:bg-brand-apple text-white dark:text-brand-dark px-4 py-3 rounded-xl shadow w-full sm:w-52">
      <Users className="w-6 h-6 mr-3" />
      <div>
        <p className="text-sm font-medium">Groups</p>
        <p className="text-xl font-bold">{totalGroups}</p>
      </div>
    </div>

    <div className="flex items-center bg-brand-green dark:bg-brand-apple text-white dark:text-brand-dark px-4 py-3 rounded-xl shadow w-full sm:w-52">
      <UsersRound className="w-6 h-6 mr-3" />
      <div>
        <p className="text-sm font-medium">Farmers</p>
        <p className="text-xl font-bold">{totalFarmers}</p>
      </div>
    </div>
  </div>
);

const GroupStats = ({ statusCounts }: GroupStatsProps) => {
  const chartData: StatusDataItem[] = Object.entries(statusCounts).map(
    ([label, value]) => ({ label, value })
  );

  return (
    <div className="mb-6 w-full max-w-xs">
      <StatusPie data={chartData} />
    </div>
  );
};

const FarmerStats = ({ farmerByGroup }: FarmerStatsProps) => {
  const chartData: StatusDataItem[] = farmerByGroup.map((item) => ({
    label: item.group,
    value: item.total,
  }));

  return (
    <div className="mb-6 w-full max-w-xs">
      <StatusPie data={chartData} />
    </div>
  );
};

export { OverviewStats, GroupStats, FarmerStats };
