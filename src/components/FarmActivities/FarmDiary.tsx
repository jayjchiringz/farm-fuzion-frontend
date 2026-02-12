import React, { useState, useEffect } from "react";
import { farmActivitiesApi, FarmDiaryEntry, FarmSeason } from "../../services/farmActivitiesApi";

interface FarmDiaryProps {
  farmerId: number;
  seasons?: FarmSeason[];
}

export const FarmDiary: React.FC<FarmDiaryProps> = ({ farmerId, seasons = [] }) => {
  const [entries, setEntries] = useState<FarmDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>();
  const [newEntry, setNewEntry] = useState<Partial<FarmDiaryEntry>>({
    farmer_id: farmerId,
    entry_type: "observation",
    content: "",
    entry_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadEntries();
  }, [farmerId, selectedSeason]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await farmActivitiesApi.getFarmerDiaryEntries(farmerId, {
        season_id: selectedSeason,
        limit: 20
      });
      setEntries(response.data);
    } catch (error) {
      console.error("Error loading diary entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async () => {
    if (!newEntry.content) {
      alert("Please enter diary content");
      return;
    }

    try {
      await farmActivitiesApi.createDiaryEntry({
        farmer_id: farmerId,
        season_id: newEntry.season_id,
        entry_date: newEntry.entry_date,
        title: newEntry.title,
        entry_type: newEntry.entry_type as any,
        content: newEntry.content,
        weather_condition: newEntry.weather_condition,
        temperature: newEntry.temperature,
        rainfall_mm: newEntry.rainfall_mm,
        tags: newEntry.tags || []
      });

      setShowNewEntry(false);
      setNewEntry({
        farmer_id: farmerId,
        entry_type: "observation",
        content: "",
        entry_date: new Date().toISOString().split('T')[0]
      });
      loadEntries();
    } catch (error) {
      console.error("Error creating diary entry:", error);
      alert("Failed to save diary entry");
    }
  };

  const getEntryIcon = (type: string) => {
    const icons: Record<string, string> = {
      observation: "👁️",
      issue: "⚠️",
      milestone: "🏆",
      weather: "☁️",
      expense: "💰",
      harvest: "🌾",
      learning: "📚"
    };
    return icons[type] || "📝";
  };

  return (
    <div className="farm-diary p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-brand-dark dark:text-brand-apple">
          📓 Farm Diary
        </h3>
        <button
          onClick={() => setShowNewEntry(!showNewEntry)}
          className="bg-brand-green text-white px-3 py-1 rounded text-sm hover:bg-brand-dark"
        >
          {showNewEntry ? "✕ Cancel" : "+ New Entry"}
        </button>
      </div>

      {seasons.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedSeason || ""}
            onChange={(e) => setSelectedSeason(e.target.value ? Number(e.target.value) : undefined)}
            className="p-2 border rounded text-sm dark:bg-gray-800"
          >
            <option value="">All Seasons</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.season_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showNewEntry && (
        <div className="border rounded p-4 mb-4 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={newEntry.entry_type}
              onChange={(e) => setNewEntry({ ...newEntry, entry_type: e.target.value as any })}
              className="p-2 border rounded text-sm"
            >
              <option value="observation">👁️ Observation</option>
              <option value="issue">⚠️ Issue</option>
              <option value="milestone">🏆 Milestone</option>
              <option value="weather">☁️ Weather</option>
              <option value="expense">💰 Expense</option>
              <option value="harvest">🌾 Harvest</option>
              <option value="learning">📚 Learning</option>
            </select>
            
            <input
              type="date"
              value={newEntry.entry_date}
              onChange={(e) => setNewEntry({ ...newEntry, entry_date: e.target.value })}
              className="p-2 border rounded text-sm"
            />
          </div>

          <input
            type="text"
            placeholder="Title (optional)"
            value={newEntry.title || ""}
            onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
            className="w-full p-2 border rounded mb-3 text-sm"
          />

          <textarea
            placeholder="What happened on the farm today?"
            value={newEntry.content}
            onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
            rows={3}
            className="w-full p-2 border rounded mb-3 text-sm"
          />

          <div className="grid grid-cols-3 gap-2 mb-3">
            <input
              type="text"
              placeholder="Weather"
              value={newEntry.weather_condition || ""}
              onChange={(e) => setNewEntry({ ...newEntry, weather_condition: e.target.value })}
              className="p-2 border rounded text-sm"
            />
            <input
              type="number"
              placeholder="Temp °C"
              value={newEntry.temperature || ""}
              onChange={(e) => setNewEntry({ ...newEntry, temperature: parseFloat(e.target.value) })}
              className="p-2 border rounded text-sm"
            />
            <input
              type="number"
              placeholder="Rainfall mm"
              value={newEntry.rainfall_mm || ""}
              onChange={(e) => setNewEntry({ ...newEntry, rainfall_mm: parseFloat(e.target.value) })}
              className="p-2 border rounded text-sm"
            />
          </div>

          <button
            onClick={createEntry}
            className="w-full bg-brand-green text-white py-2 rounded text-sm hover:bg-brand-dark"
          >
            Save Diary Entry
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-4">Loading diary entries...</p>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📔</p>
          <p>No diary entries yet</p>
          <p className="text-sm mt-2">Start documenting your farming journey!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="border rounded p-3 dark:border-gray-700">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getEntryIcon(entry.entry_type)}</span>
                  <span className="font-medium">{entry.title || entry.entry_type}</span>
                </div>
                <span className="text-xs text-gray-500">{entry.entry_date}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
              {(entry.weather_condition || entry.temperature) && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  ☁️ {entry.weather_condition} 
                  {entry.temperature && ` · ${entry.temperature}°C`}
                  {entry.rainfall_mm && ` · ${entry.rainfall_mm}mm rain`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};