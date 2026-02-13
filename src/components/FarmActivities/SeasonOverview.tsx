import React, { useState, useEffect } from "react";
import { farmActivitiesApi, FarmSeason, SeasonActivity } from "../../services/farmActivitiesApi";

interface SeasonOverviewProps {
  farmerId: number;
}

export const SeasonOverview: React.FC<SeasonOverviewProps> = ({ farmerId }) => {
  const [seasons, setSeasons] = useState<FarmSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<FarmSeason | null>(null);
  const [activities, setActivities] = useState<SeasonActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  // Add state for financial data
  const [seasonFinancials, setSeasonFinancials] = useState({
    totalExpenses: 0,
    totalHarvestValue: 0,
    totalSales: 0,
    profitLoss: 0
  });

  // Add function to calculate season financials
  const calculateSeasonFinancials = async (seasonId: number) => {
    try {
      // Get diary entries for this season
      const diaryResponse = await farmActivitiesApi.getFarmerDiaryEntries(farmerId, {
        season_id: seasonId,
        limit: 100
      });
      
      let expenses = 0;
      let harvestValue = 0;
      let sales = 0;
      
      diaryResponse.data.forEach(entry => {
        if (entry.metadata) {
          if (entry.entry_type === 'expense' && entry.metadata.amount) {
            expenses += entry.metadata.amount;
          }
          if (entry.entry_type === 'harvest') {
            if (entry.metadata.estimated_value) {
              harvestValue += entry.metadata.estimated_value;
            }
            if (entry.metadata.actual_sales) {
              sales += entry.metadata.actual_sales;
            }
          }
        }
      });
      
      setSeasonFinancials({
        totalExpenses: expenses,
        totalHarvestValue: harvestValue,
        totalSales: sales,
        profitLoss: sales - expenses
      });
    } catch (error) {
      console.error("Error calculating season financials:", error);
    }
  };  

  // Call this when season changes
  useEffect(() => {
    if (selectedSeason) {
      calculateSeasonFinancials(selectedSeason.id!);
    }
  }, [selectedSeason]);

  useEffect(() => {
    loadSeasons();
  }, [farmerId]);

  useEffect(() => {
    if (selectedSeason) {
      loadActivities(selectedSeason.id!);
    }
  }, [selectedSeason]);

  const loadSeasons = async () => {
    try {
      setLoading(true);
      const response = await farmActivitiesApi.getFarmerSeasons(farmerId);
      setSeasons(response.data);
      if (response.data.length > 0) {
        setSelectedSeason(response.data[0]);
      }
    } catch (error) {
      console.error("Error loading seasons:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async (seasonId: number) => {
    try {
      const response = await farmActivitiesApi.getSeasonActivities(seasonId);
      setActivities(response.data);
      setSummary(response.summary);
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  };

  const updateActivityStatus = async (activity: SeasonActivity, status: string) => {
    try {
      const updated = await farmActivitiesApi.updateActivity(activity.id!, {
        status: status as any,
        completion_percentage: status === 'completed' ? 100 : activity.completion_percentage
      });
      
      setActivities(activities.map(a => 
        a.id === updated.id ? updated : a
      ));
      
      // Reload activities to update summary
      if (selectedSeason) {
        loadActivities(selectedSeason.id!);
      }
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  if (loading) {
    return <div className="p-4 text-center">Loading seasons...</div>;
  }

  if (seasons.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-4xl mb-2">🌱</p>
        <p>No farming seasons yet</p>
        <p className="text-sm mt-2">Create your first season plan to get started!</p>
      </div>
    );
  }

  return (
    <div className="season-overview p-4">
      {/* Season Selector */}
      <div className="mb-4">
        <select
          value={selectedSeason?.id}
          onChange={(e) => {
            const season = seasons.find(s => s.id === Number(e.target.value));
            setSelectedSeason(season || null);
          }}
          className="w-full p-2 border rounded dark:bg-gray-800"
        >
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.season_name} - {season.status} ({season.start_date} to {season.expected_end_date})
            </option>
          ))}
        </select>
      </div>

      {selectedSeason && (
        <>
          {/* Season Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400">Season Status</div>
              <div className="text-lg font-semibold capitalize">{selectedSeason.status}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400">Crop</div>
              <div className="text-lg font-semibold">{selectedSeason.target_crop}</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400">Acreage</div>
              <div className="text-lg font-semibold">{selectedSeason.acreage} acres</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400">Location</div>
              <div className="text-lg font-semibold">{selectedSeason.location}</div>
            </div>
          </div>

          {/* Progress Summary */}
          {summary && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span className="font-semibold">
                  {summary.completed} / {summary.total} activities completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-brand-green h-2.5 rounded-full transition-all"
                  style={{ width: `${summary.total > 0 ? (summary.completed / summary.total) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-2 text-gray-600 dark:text-gray-400">
                <span>Pending: {summary.pending}</span>
                <span>In Progress: {summary.in_progress || 0}</span>
                <span>Completed: {summary.completed}</span>
              </div>
            </div>
          )}

          {/* Activities Timeline */}
          <h4 className="font-medium mb-2">📋 Activities Timeline</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="border rounded p-3 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{activity.activity_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        activity.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        activity.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.priority}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      📅 Planned: {activity.planned_date}
                      {activity.deadline_date && ` • Deadline: ${activity.deadline_date}`}
                    </div>
                    {activity.description && (
                      <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={activity.status}
                      onChange={(e) => updateActivityStatus(activity, e.target.value)}
                      className="text-xs p-1 border rounded dark:bg-gray-800"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="in_progress">🔄 In Progress</option>
                      <option value="completed">✅ Completed</option>
                      <option value="delayed">⚠️ Delayed</option>
                    </select>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {activity.status === 'in_progress' && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{activity.completion_percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`${getProgressColor(activity.completion_percentage || 0)} h-1.5 rounded-full`}
                        style={{ width: `${activity.completion_percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {activity.actual_cost && (
                  <div className="mt-1 text-xs text-gray-600">
                    💰 Actual Cost: Ksh {activity.actual_cost.toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Seasonal Expenses */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Expenses</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                Ksh {seasonFinancials.totalExpenses.toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400">Harvest Value</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                Ksh {seasonFinancials.totalHarvestValue.toLocaleString()}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <div className="text-xs text-gray-600 dark:text-gray-400">Actual Sales</div>
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                Ksh {seasonFinancials.totalSales.toLocaleString()}
              </div>
            </div>
            <div className={`${seasonFinancials.profitLoss >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'} p-3 rounded`}>
              <div className="text-xs text-gray-600 dark:text-gray-400">Profit/Loss</div>
              <div className={`text-lg font-semibold ${seasonFinancials.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                Ksh {seasonFinancials.profitLoss.toLocaleString()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
