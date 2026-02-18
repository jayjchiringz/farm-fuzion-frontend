// farm-fuzion-frontend/src/components/FarmActivities/FarmPlanner.tsx
import React, { useState, useEffect } from "react";
import { farmActivitiesApi, Crop, FarmSeason, SeasonActivity, CropPlanningRequest } from "../../services/farmActivitiesApi";
import { counties, constituencies, wards } from "kenya-locations";
import { Edit2, Save, X, Plus, Trash2, Calendar, DollarSign } from "lucide-react";

interface FarmPlannerProps {
  farmerId: number;
  onPlanCreated?: (seasonId: number) => void;
  onClose?: () => void;
}

interface EditableActivity extends SeasonActivity {
  isEditing?: boolean;
  tempData?: Partial<SeasonActivity>;
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
    activities: EditableActivity[];
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingActivityIndex, setEditingActivityIndex] = useState<number | null>(null);

  // Location state
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedConstituency, setSelectedConstituency] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

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

  // Handle location changes
  const handleCountyChange = (countyName: string) => {
    setSelectedCounty(countyName);
    setSelectedConstituency("");
    setSelectedWard("");
    setPlanRequest(prev => ({
      ...prev,
      county: countyName,
      sub_county: "",
      location: countyName
    }));
  };

  const handleConstituencyChange = (constituencyName: string) => {
    setSelectedConstituency(constituencyName);
    setSelectedWard("");
    setPlanRequest(prev => ({
      ...prev,
      sub_county: constituencyName,
      location: `${prev.county} - ${constituencyName}`
    }));
  };

  const handleWardChange = (wardName: string) => {
    setSelectedWard(wardName);
    setPlanRequest(prev => ({
      ...prev,
      location: `${prev.county} - ${prev.sub_county} - ${wardName}`
    }));
  };

  const generatePlan = async () => {
    if (!planRequest.crop_name || !planRequest.county || !planRequest.start_date || !planRequest.acreage) {
      alert("Please fill in all required fields: Crop, County, Start Date, and Acreage");
      return;
    }

    try {
      setGenerating(true);
      const plan = await farmActivitiesApi.generatePlan(planRequest as CropPlanningRequest);
      // Add editable flag to activities
      const editableActivities = plan.activities.map(activity => ({
        ...activity,
        isEditing: false
      }));
      setGeneratedPlan({
        season: plan.season,
        activities: editableActivities
      });
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
        activities: generatedPlan.activities.map(({ isEditing, tempData, ...activity }) => activity)
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

  // Activity editing functions
  const startEditingActivity = (index: number) => {
    const updatedActivities = [...generatedPlan!.activities];
    updatedActivities[index] = {
      ...updatedActivities[index],
      isEditing: true,
      tempData: { ...updatedActivities[index] }
    };
    setGeneratedPlan({
      ...generatedPlan!,
      activities: updatedActivities
    });
    setEditingActivityIndex(index);
  };

  const cancelEditingActivity = (index: number) => {
    const updatedActivities = [...generatedPlan!.activities];
    updatedActivities[index] = {
      ...updatedActivities[index],
      isEditing: false,
      tempData: undefined
    };
    setGeneratedPlan({
      ...generatedPlan!,
      activities: updatedActivities
    });
    setEditingActivityIndex(null);
  };

  const updateActivityField = (index: number, field: keyof SeasonActivity, value: any) => {
    const updatedActivities = [...generatedPlan!.activities];
    if (!updatedActivities[index].tempData) {
      updatedActivities[index].tempData = {};
    }
    updatedActivities[index].tempData = {
      ...updatedActivities[index].tempData,
      [field]: value
    };
    setGeneratedPlan({
      ...generatedPlan!,
      activities: updatedActivities
    });
  };

  const saveActivityChanges = (index: number) => {
    const updatedActivities = [...generatedPlan!.activities];
    const activity = updatedActivities[index];
    
    if (activity.tempData) {
      // Apply changes
      updatedActivities[index] = {
        ...activity,
        ...activity.tempData,
        isEditing: false,
        tempData: undefined
      };
      
      // Recalculate deadline if planned date changed
      if (activity.tempData.planned_date && activity.tempData.planned_date !== activity.planned_date) {
        // You might want to add logic here to adjust deadline based on new planned date
        // For now, we'll keep the original deadline calculation
      }
    }
    
    setGeneratedPlan({
      ...generatedPlan!,
      activities: updatedActivities
    });
    setEditingActivityIndex(null);
  };

  const deleteActivity = (index: number) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      const updatedActivities = generatedPlan!.activities.filter((_, i) => i !== index);
      setGeneratedPlan({
        ...generatedPlan!,
        activities: updatedActivities
      });
    }
  };

  const addNewActivity = () => {
    const newActivity: EditableActivity = {
      activity_type: "monitoring",
      activity_name: "New Activity",
      description: "Custom activity",
      planned_date: new Date().toISOString().split('T')[0],
      deadline_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: "medium",
      cost_estimate: 0,
      completion_percentage: 0,
      status: "pending",
      isEditing: true,
      tempData: {}
    };

    setGeneratedPlan({
      ...generatedPlan!,
      activities: [...generatedPlan!.activities, newActivity]
    });
    setEditingActivityIndex(generatedPlan!.activities.length);
  };

  const updateSeasonField = (field: keyof FarmSeason, value: any) => {
    if (!generatedPlan) return;
    setGeneratedPlan({
      ...generatedPlan,
      season: {
        ...generatedPlan.season,
        [field]: value
      }
    });
  };

  const activityTypeOptions = [
    "land_preparation", "planting", "fertilizer_application", "pest_control",
    "weeding", "irrigation", "harvesting", "post_harvest", "monitoring"
  ];

  const priorityOptions = ["low", "medium", "high", "critical"];

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

            {/* County Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">County *</label>
              <select
                value={selectedCounty}
                onChange={(e) => handleCountyChange(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">Select County</option>
                {counties.map((county) => (
                  <option key={county.name} value={county.name}>
                    {county.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Constituency Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Constituency</label>
              <select
                value={selectedConstituency}
                onChange={(e) => handleConstituencyChange(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                disabled={!selectedCounty}
              >
                <option value="">Select Constituency</option>
                {constituencies
                  .filter((c) => c.county === selectedCounty)
                  .map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Ward Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Ward</label>
              <select
                value={selectedWard}
                onChange={(e) => handleWardChange(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                disabled={!selectedConstituency}
              >
                <option value="">Select Ward</option>
                {wards
                  .filter((w) => w.constituency === selectedConstituency)
                  .map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Location Display */}
            <div>
              <label className="block text-sm font-medium mb-1">Full Location</label>
              <input
                type="text"
                placeholder="Auto-generated from selections"
                value={planRequest.location || ""}
                readOnly
                className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
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
            disabled={generating || !planRequest.crop_name || !selectedCounty || !planRequest.start_date}
            className="w-full bg-brand-green text-white py-2 px-4 rounded hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {generating ? "🤖 Generating Intelligent Plan..." : "🚜 Generate Farm Plan"}
          </button>
        </div>
      ) : (
        // Step 2: Review & Edit Plan
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-brand-dark dark:text-brand-apple">
              📅 Edit Your Farm Plan
            </h3>
            <button
              onClick={() => setGeneratedPlan(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Season Details */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded mb-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar size={16} /> Season Details
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="font-medium block text-xs text-gray-500">Season Name</span>
                <input
                  type="text"
                  value={generatedPlan.season.season_name}
                  onChange={(e) => updateSeasonField('season_name', e.target.value)}
                  className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <span className="font-medium block text-xs text-gray-500">Crop</span>
                <input
                  type="text"
                  value={generatedPlan.season.target_crop}
                  onChange={(e) => updateSeasonField('target_crop', e.target.value)}
                  className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <span className="font-medium block text-xs text-gray-500">Location</span>
                <input
                  type="text"
                  value={generatedPlan.season.location || ''}
                  onChange={(e) => updateSeasonField('location', e.target.value)}
                  className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <span className="font-medium block text-xs text-gray-500">Acreage</span>
                <input
                  type="number"
                  step="0.1"
                  value={generatedPlan.season.acreage}
                  onChange={(e) => updateSeasonField('acreage', parseFloat(e.target.value))}
                  className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <span className="font-medium block text-xs text-gray-500">Start Date</span>
                <input
                  type="date"
                  value={generatedPlan.season.start_date}
                  onChange={(e) => updateSeasonField('start_date', e.target.value)}
                  className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <span className="font-medium block text-xs text-gray-500">Expected End</span>
                <input
                  type="date"
                  value={generatedPlan.season.expected_end_date}
                  onChange={(e) => updateSeasonField('expected_end_date', e.target.value)}
                  className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Activities */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Edit2 size={16} /> Activities ({generatedPlan.activities.length})
              </h4>
              <button
                onClick={addNewActivity}
                className="flex items-center gap-1 text-sm bg-brand-green text-white px-3 py-1 rounded hover:bg-brand-dark"
              >
                <Plus size={14} /> Add Activity
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedPlan.activities.map((activity, index) => (
                <div key={index} className="border rounded p-3 dark:border-gray-700">
                  {activity.isEditing ? (
                    // Edit Mode
                    <div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-xs text-gray-500">Activity Name</label>
                          <input
                            type="text"
                            value={activity.tempData?.activity_name || activity.activity_name}
                            onChange={(e) => updateActivityField(index, 'activity_name', e.target.value)}
                            className="w-full p-1 text-sm border rounded dark:bg-gray-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Type</label>
                          <select
                            value={activity.tempData?.activity_type || activity.activity_type}
                            onChange={(e) => updateActivityField(index, 'activity_type', e.target.value)}
                            className="w-full p-1 text-sm border rounded dark:bg-gray-800"
                          >
                            {activityTypeOptions.map(type => (
                              <option key={type} value={type}>{type.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Planned Date</label>
                          <input
                            type="date"
                            value={activity.tempData?.planned_date || activity.planned_date}
                            onChange={(e) => updateActivityField(index, 'planned_date', e.target.value)}
                            className="w-full p-1 text-sm border rounded dark:bg-gray-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Deadline</label>
                          <input
                            type="date"
                            value={activity.tempData?.deadline_date || activity.deadline_date}
                            onChange={(e) => updateActivityField(index, 'deadline_date', e.target.value)}
                            className="w-full p-1 text-sm border rounded dark:bg-gray-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Priority</label>
                          <select
                            value={activity.tempData?.priority || activity.priority}
                            onChange={(e) => updateActivityField(index, 'priority', e.target.value)}
                            className="w-full p-1 text-sm border rounded dark:bg-gray-800"
                          >
                            {priorityOptions.map(priority => (
                              <option key={priority} value={priority}>{priority}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Cost (Ksh)</label>
                          <input
                            type="number"
                            value={activity.tempData?.cost_estimate || activity.cost_estimate || 0}
                            onChange={(e) => updateActivityField(index, 'cost_estimate', parseFloat(e.target.value))}
                            className="w-full p-1 text-sm border rounded dark:bg-gray-800"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500">Description</label>
                          <input
                            type="text"
                            value={activity.tempData?.description || activity.description || ''}
                            onChange={(e) => updateActivityField(index, 'description', e.target.value)}
                            className="w-full p-1 text-sm border rounded dark:bg-gray-800"
                            placeholder="Activity description"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => cancelEditingActivity(index)}
                          className="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveActivityChanges(index)}
                          className="px-2 py-1 text-sm bg-brand-green text-white rounded hover:bg-brand-dark"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{activity.activity_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              activity.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              activity.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                              activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {activity.priority}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <div className="text-gray-600 dark:text-gray-400">
                              📅 {activity.planned_date}
                              {activity.deadline_date && ` → ${activity.deadline_date}`}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              💰 Ksh {activity.cost_estimate?.toLocaleString() || 0}
                            </div>
                            {activity.description && (
                              <div className="col-span-2 text-xs text-gray-500">
                                {activity.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => startEditingActivity(index)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteActivity(index)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={savePlan}
              disabled={isSaving}
              className="flex-1 bg-brand-green text-white py-2 px-4 rounded hover:bg-brand-dark disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Season Plan"}
            </button>
            <button
              onClick={() => setGeneratedPlan(null)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
            >
              Back to Planning
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
