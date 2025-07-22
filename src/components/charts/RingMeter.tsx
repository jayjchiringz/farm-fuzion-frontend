import React from "react";

interface StatusDataItem {
  label: string;
  value: number;
}

interface RingMeterProps {
  title: string;
  data: StatusDataItem[];
}

const getTotal = (data: StatusDataItem[]) =>
  data.reduce((acc, cur) => acc + cur.value, 0);

const RingMeter = ({ title, data }: RingMeterProps) => {
  const total = getTotal(data);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm">
      <h4 className="text-lg font-semibold text-brand-apple mb-4">{title}</h4>
      <ul className="space-y-2">
        {data.map((item, index) => {
          const percent = total === 0 ? 0 : (item.value / total) * 100;

          return (
            <li key={index} className="text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full transition-all`}
                  style={{
                    width: `${percent}%`,
                    backgroundColor: ["#8dc71d", "#0d5b10", "#facc15", "#ef4444"][index % 4],
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RingMeter;
