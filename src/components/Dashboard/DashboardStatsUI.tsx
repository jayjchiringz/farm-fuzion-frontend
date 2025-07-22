import React from "react";
import { Users, UsersRound } from "lucide-react";
import RingMeter from "./charts/RingMeter.tsx"; // 🆕 New chart we'll build

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

const OverviewStats = ({ totalGroups, totalFarmers }: OverviewStatsProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <div className="flex items-center bg-brand-green dark:bg-brand-apple text-white dark:text-brand-dark px-4 py-3 rounded-xl shadow w-full">
      <Users className="w-6 h-6 mr-3" />
      <div>
        <p className="text-sm font-medium">Groups</p>
        <p className="text-xl font-bold">{totalGroups}</p>
      </div>
    </div>

    <div className="flex items-center bg-brand-green dark:bg-brand-apple text-white dark:text-brand-dark px-4 py-3 rounded-xl shadow w-full">
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
    <div className="mb-6 w-full max-w-sm">
      <RingMeter title="Group Status" data={chartData} />
    </div>
  );
};

const FarmerStats = ({ farmerByGroup }: FarmerStatsProps) => {
  const chartData: StatusDataItem[] = farmerByGroup.map((item) => ({
    label: item.group,
    value: item.total,
  }));

  return (
    <div className="mb-6 w-full max-w-sm">
      <RingMeter title="Farmers by Group" data={chartData} />
    </div>
  );
};

export { OverviewStats, GroupStats, FarmerStats };
