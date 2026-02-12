import React, { useState, useEffect } from "react";
import { farmActivitiesApi, Crop, FarmSeason, SeasonActivity, CropPlanningRequest } from "../../services/farmActivitiesApi";

interface FarmPlannerProps {
  farmerId: number;
  onPlanCreated?: (seasonId: number) => void;
  onClose?: () => void;
}

export const FarmPlanner: React.FC<FarmPlannerProps> = ({ 
  farmerId, 
  onPlanCreated,
  onClose 
}) => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [planRequest, setPlanRequest] = useState<Partial<CropPlanningRequest>>({
    farmer_id: farmerId,
    location: "",
    county: "",
    sub_county: "",
    acreage: 1,
    farming_method: "rainfed",
    soil_type: ""
  });
  const [generatedPlan, setGeneratedPlan] = useState<{
    season: FarmSeason;
    activities: SeasonActivity[];
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load crops on mount
  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
    try {
      setLoading(true);
      const response = await farmActivitiesApi.getCrops();
      setCrops(response.data);
    } catch (error) {
      console.error("Error loading crops:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCropSelect = (cropName: string) => {
    const crop = crops.find(c => c.crop_name === cropName);
    setSelectedCrop(crop || null);
    setPlanRequest(prev => ({ ...prev, crop_name: cropName }));
  };

  const generatePlan = async () => {
    if (!planRequest.crop_name || !planRequest.location || !planRequest.start_date || !planRequest.acreage) {
      alert("Please fill in all required fields: Crop, Location, Start Date, and Acreage");
      return;
    }

    try {
      setGenerating(true);
      const plan = await farmActivitiesApi.generatePlan(planRequest as CropPlanningRequest);
      setGeneratedPlan(plan);
    } catch (error) {
      console.error("Error generating plan:", error);
      alert("Failed to generate farm plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const savePlan = async () => {
    if (!generatedPlan) return;

    try {
      setIsSaving(true);
      const result = await farmActivitiesApi.createSeasonWithActivities({
        season: {
          ...generatedPlan.season,
          farmer_id: farmerId
        },
        activities: generatedPlan.activities
      });
      
      alert(`Season created successfully! Season ID: ${result.season_id}`);
      onPlanCreated?.(result.season_id);
      onClose?.();
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Failed to save farm plan. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateActivityDate = (index: number, field: string, value: string) => {
    if (!generatedPlan) return;
    
    const updatedActivities = [...generatedPlan.activities];
    updatedActivities[index] = {
      ...updatedActivities[index],
      [field]: value
    };
    
    setGeneratedPlan({
      ...generatedPlan,
      activities: updatedActivities
    });
  };

  return (
    <div className="farm-planner p-4">
      {!generatedPlan ? (
        // Step 1: Crop Selection & Planning Form
        <div>
          <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-brand-apple">
            🌱 Plan Your Farming Season
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Crop *</label>
              <select
                value={planRequest.crop_name || ""}
                onChange={(e) => handleCropSelect(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                disabled={loading}
              >
                <option value="">-- Choose a crop --</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.crop_name}>
                    {crop.crop_name} ({crop.growth_days} days)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Farming Method</label>
              <select
                value={planRequest.farming_method}
                onChange={(e) => setPlanRequest({ ...planRequest, farming_method: e.target.value as any })}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="rainfed">Rainfed</option>
                <option value="irrigated">Irrigated</option>
                <option value="greenhouse">Greenhouse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Farm Location *</label>
              <input
                type="text"
                placeholder="e.g., Nakuru, Eldoret, Kiambu"
                value={planRequest.location}
                onChange={(e) => setPlanRequest({ ...planRequest, location: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">County</label>
              <input
                type="text"
                placeholder="e.g., Nakuru, Uasin Gishu"
                value={planRequest.county}
                onChange={(e) => setPlanRequest({ ...planRequest, county: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sub-county</label>
              <input
                type="text"
                value={planRequest.sub_county}
                onChange={(e) => setPlanRequest({ ...planRequest, sub_county: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Acreage (acres) *</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={planRequest.acreage}
                onChange={(e) => setPlanRequest({ ...planRequest, acreage: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Planned Start Date *</label>
              <input
                type="date"
                value={planRequest.start_date}
                onChange={(e) => setPlanRequest({ ...planRequest, start_date: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Soil Type</label>
              <select
                value={planRequest.soil_type}
                onChange={(e) => setPlanRequest({ ...planRequest, soil_type: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">-- Select --</option>
                <option value="volcanic">Volcanic</option>
                <option value="loamy">Loamy</option>
                <option value="clay">Clay</option>
                <option value="sandy">Sandy</option>
                <option value="black_cotton">Black Cotton</option>
              </select>
            </div>
          </div>

          {selectedCrop && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mb-4 text-sm">
              <p className="font-semibold">📋 {selectedCrop.crop_name} Growing Info:</p>
              <p>Growth period: {selectedCrop.growth_days} days</p>
              {selectedCrop.description && <p>{selectedCrop.description}</p>}
            </div>
          )}

          <button
            onClick={generatePlan}
            disabled={generating || !planRequest.crop_name || !planRequest.location || !planRequest.start_date}
            className="w-full bg-brand-green text-white py-2 px-4 rounded hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {generating ? "🤖 Generating Intelligent Plan..." : "🚜 Generate Farm Plan"}
          </button>
        </div>
      ) : (
        // Step 2: Review & Customize Plan
        <div>
          <h3 className="text-lg font-semibold mb-2 text-brand-dark dark:text-brand-apple">
            📅 Your Farm Plan: {generatedPlan.season.season_name}
          </h3>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Season:</span> {generatedPlan.season.season_name}</div>
              <div><span className="font-medium">Location:</span> {generatedPlan.season.location}</div>
              <div><span className="font-medium">Acreage:</span> {generatedPlan.season.acreage} acres</div>
              <div><span className="font-medium">Start:</span> {generatedPlan.season.start_date}</div>
              <div><span className="font-medium">Expected Harvest:</span> {generatedPlan.season.expected_end_date}</div>
            </div>
          </div>

          <h4 className="font-medium mb-2">📋 Recommended Activities (You can adjust dates)</h4>
          
          <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
            {generatedPlan.activities.map((activity, index) => (
              <div key={index} className="border rounded p-3 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{activity.activity_name}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                      activity.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      activity.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {activity.priority}
                    </span>
                  </div>
                  <span className="text-sm">Ksh {activity.cost_estimate?.toLocaleString()}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="block text-xs text-gray-500">Planned Date</label>
                    <input
                      type="date"
                      value={activity.planned_date}
                      onChange={(e) => updateActivityDate(index, 'planned_date', e.target.value)}
                      className="w-full p-1 text-sm border rounded dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Deadline</label>
                    <input
                      type="date"
                      value={activity.deadline_date}
                      onChange={(e) => updateActivityDate(index, 'deadline_date', e.target.value)}
                      className="w-full p-1 text-sm border rounded dark:bg-gray-800"
                    />
                  </div>
                </div>
                
                {activity.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={savePlan}
              disabled={isSaving}
              className="flex-1 bg-brand-green text-white py-2 px-4 rounded hover:bg-brand-dark disabled:opacity-50"
            >
              {isSaving ? "💾 Saving..." : "✅ Save Season Plan"}
            </button>
            <button
              onClick={() => setGeneratedPlan(null)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
            >
              🔄 Adjust
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
