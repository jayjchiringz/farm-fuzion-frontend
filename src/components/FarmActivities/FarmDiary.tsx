import React, { useState, useEffect } from "react";
import { farmActivitiesApi, FarmDiaryEntry, FarmSeason } from "../../services/farmActivitiesApi";

interface FarmDiaryProps {
  farmerId: number;
  seasons?: FarmSeason[];
}

// Extended type for expense entries
interface ExpenseDetails {
  amount?: number;
  category?: string;
  payment_method?: string;
  vendor?: string;
  notes?: string;
}

interface HarvestDetails {
  quantity?: number;
  unit?: string;
  estimated_value?: number;
  actual_sales?: number;
  buyer?: string;
}

export const FarmDiary: React.FC<FarmDiaryProps> = ({ farmerId, seasons = [] }) => {
  const [entries, setEntries] = useState<FarmDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>();
  const [financialSummary, setFinancialSummary] = useState({
    totalExpenses: 0,
    totalHarvestValue: 0,
    totalSales: 0,
    netProfit: 0
  });

  const [newEntry, setNewEntry] = useState<Partial<FarmDiaryEntry> & {
    expense_details?: ExpenseDetails;
    harvest_details?: HarvestDetails;
  }>({
    farmer_id: farmerId,
    entry_type: "observation",
    content: "",
    entry_date: new Date().toISOString().split('T')[0],
    expense_details: {
      amount: 0,
      category: "inputs",
      payment_method: "cash",
      vendor: ""
    },
    harvest_details: {
      quantity: 0,
      unit: "kg",
      estimated_value: 0,
      actual_sales: 0,
      buyer: ""
    }
  });

  useEffect(() => {
    loadEntries();
  }, [farmerId, selectedSeason]);

  useEffect(() => {
    calculateFinancialSummary();
  }, [entries]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await farmActivitiesApi.getFarmerDiaryEntries(farmerId, {
        season_id: selectedSeason,
        limit: 50
      });
      setEntries(response.data);
    } catch (error) {
      console.error("Error loading diary entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialSummary = () => {
    let expenses = 0;
    let harvestValue = 0;
    let sales = 0;

    entries.forEach(entry => {
      // Parse metadata if it exists
      if (entry.metadata) {
        if (entry.entry_type === 'expense' && entry.metadata.amount) {
          expenses += Number(entry.metadata.amount);
        }
        if (entry.entry_type === 'harvest') {
          if (entry.metadata.estimated_value) {
            harvestValue += Number(entry.metadata.estimated_value);
          }
          if (entry.metadata.actual_sales) {
            sales += Number(entry.metadata.actual_sales);
          }
        }
      }
    });

    setFinancialSummary({
      totalExpenses: expenses,
      totalHarvestValue: harvestValue,
      totalSales: sales,
      netProfit: sales - expenses
    });
  };

  const createEntry = async () => {
    if (!newEntry.content) {
      alert("Please enter diary content");
      return;
    }

    // Prepare metadata based on entry type
    const metadata: any = {};
    
    if (newEntry.entry_type === 'expense' && newEntry.expense_details) {
      metadata.amount = newEntry.expense_details.amount;
      metadata.category = newEntry.expense_details.category;
      metadata.payment_method = newEntry.expense_details.payment_method;
      metadata.vendor = newEntry.expense_details.vendor;
      metadata.notes = newEntry.expense_details.notes;
    }
    
    if (newEntry.entry_type === 'harvest' && newEntry.harvest_details) {
      metadata.quantity = newEntry.harvest_details.quantity;
      metadata.unit = newEntry.harvest_details.unit;
      metadata.estimated_value = newEntry.harvest_details.estimated_value;
      metadata.actual_sales = newEntry.harvest_details.actual_sales;
      metadata.buyer = newEntry.harvest_details.buyer;
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
        tags: newEntry.tags || [],
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      });

      setShowNewEntry(false);
      setNewEntry({
        farmer_id: farmerId,
        entry_type: "observation",
        content: "",
        entry_date: new Date().toISOString().split('T')[0],
        expense_details: {
          amount: 0,
          category: "inputs",
          payment_method: "cash",
          vendor: ""
        },
        harvest_details: {
          quantity: 0,
          unit: "kg",
          estimated_value: 0,
          actual_sales: 0,
          buyer: ""
        }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const expenseCategories = [
    "inputs", "labor", "equipment", "transport", "marketing", 
    "utilities", "maintenance", "other"
  ];

  const paymentMethods = [
    "cash", "mpesa", "bank_transfer", "mobile_money", "credit", "other"
  ];

  const harvestUnits = [
    "kg", "bags", "crates", "pieces", "tonnes", "litres", "other"
  ];

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

      {/* Financial Summary Cards */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Expenses</div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(financialSummary.totalExpenses)}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <div className="text-xs text-gray-600 dark:text-gray-400">Harvest Value</div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(financialSummary.totalHarvestValue)}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <div className="text-xs text-gray-600 dark:text-gray-400">Actual Sales</div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {formatCurrency(financialSummary.totalSales)}
            </div>
          </div>
          <div className={`${financialSummary.netProfit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'} p-3 rounded`}>
            <div className="text-xs text-gray-600 dark:text-gray-400">Net Profit/Loss</div>
            <div className={`text-lg font-semibold ${financialSummary.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(financialSummary.netProfit)}
            </div>
          </div>
        </div>
      )}

      {seasons.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedSeason || ""}
            onChange={(e) => setSelectedSeason(e.target.value ? Number(e.target.value) : undefined)}
            className="p-2 border rounded text-sm dark:bg-gray-800 w-full md:w-auto"
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
        <div className="border rounded p-4 mb-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <select
              value={newEntry.entry_type}
              onChange={(e) => {
                const type = e.target.value as any;
                setNewEntry({ 
                  ...newEntry, 
                  entry_type: type,
                  // Reset details when changing type
                  expense_details: type === 'expense' ? newEntry.expense_details : undefined,
                  harvest_details: type === 'harvest' ? newEntry.harvest_details : undefined
                });
              }}
              className="p-2 border rounded text-sm dark:bg-gray-800"
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
              className="p-2 border rounded text-sm dark:bg-gray-800"
            />
          </div>

          {/* Expense-specific fields */}
          {newEntry.entry_type === 'expense' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-3 bg-white dark:bg-gray-900 rounded border">
              <h4 className="col-span-2 font-medium text-sm text-brand-green">💰 Expense Details</h4>
              <div>
                <label className="block text-xs mb-1">Amount (Ksh)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 5000"
                  value={newEntry.expense_details?.amount || ''}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    expense_details: {
                      ...newEntry.expense_details,
                      amount: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Category</label>
                <select
                  value={newEntry.expense_details?.category}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    expense_details: {
                      ...newEntry.expense_details,
                      category: e.target.value
                    }
                  })}
                  className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1">Payment Method</label>
                <select
                  value={newEntry.expense_details?.payment_method}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    expense_details: {
                      ...newEntry.expense_details,
                      payment_method: e.target.value
                    }
                  })}
                  className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1">Vendor/Payee</label>
                <input
                  type="text"
                  placeholder="e.g. Agrovet, Worker"
                  value={newEntry.expense_details?.vendor || ''}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    expense_details: {
                      ...newEntry.expense_details,
                      vendor: e.target.value
                    }
                  })}
                  className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                />
              </div>
            </div>
          )}

          {/* Harvest-specific fields */}
          {newEntry.entry_type === 'harvest' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-3 bg-white dark:bg-gray-900 rounded border">
              <h4 className="col-span-2 font-medium text-sm text-brand-green">🌾 Harvest Details</h4>
              <div>
                <label className="block text-xs mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 100"
                  value={newEntry.harvest_details?.quantity || ''}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    harvest_details: {
                      ...newEntry.harvest_details,
                      quantity: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Unit</label>
                <select
                  value={newEntry.harvest_details?.unit}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    harvest_details: {
                      ...newEntry.harvest_details,
                      unit: e.target.value
                    }
                  })}
                  className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                >
                  {harvestUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1">Estimated Value (Ksh)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50000"
                  value={newEntry.harvest_details?.estimated_value || ''}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    harvest_details: {
                      ...newEntry.harvest_details,
                      estimated_value: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Actual Sales (Ksh)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 45000"
                  value={newEntry.harvest_details?.actual_sales || ''}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    harvest_details: {
                      ...newEntry.harvest_details,
                      actual_sales: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs mb-1">Buyer</label>
                <input
                  type="text"
                  placeholder="e.g. Cereal Board, Local Market"
                  value={newEntry.harvest_details?.buyer || ''}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    harvest_details: {
                      ...newEntry.harvest_details,
                      buyer: e.target.value
                    }
                  })}
                  className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                />
              </div>
            </div>
          )}

          {/* Common fields */}
          <input
            type="text"
            placeholder="Title (optional)"
            value={newEntry.title || ""}
            onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
            className="w-full p-2 border rounded mb-3 text-sm dark:bg-gray-800"
          />

          <textarea
            placeholder="What happened on the farm today?"
            value={newEntry.content}
            onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
            rows={3}
            className="w-full p-2 border rounded mb-3 text-sm dark:bg-gray-800"
          />

          <div className="grid grid-cols-3 gap-2 mb-3">
            <input
              type="text"
              placeholder="Weather"
              value={newEntry.weather_condition || ""}
              onChange={(e) => setNewEntry({ ...newEntry, weather_condition: e.target.value })}
              className="p-2 border rounded text-sm dark:bg-gray-800"
            />
            <input
              type="number"
              placeholder="Temp °C"
              value={newEntry.temperature || ""}
              onChange={(e) => setNewEntry({ ...newEntry, temperature: parseFloat(e.target.value) })}
              className="p-2 border rounded text-sm dark:bg-gray-800"
            />
            <input
              type="number"
              placeholder="Rainfall mm"
              value={newEntry.rainfall_mm || ""}
              onChange={(e) => setNewEntry({ ...newEntry, rainfall_mm: parseFloat(e.target.value) })}
              className="p-2 border rounded text-sm dark:bg-gray-800"
            />
          </div>

          <button
            onClick={createEntry}
            className="w-full bg-brand-green text-white py-2 rounded text-sm hover:bg-brand-dark transition-colors"
          >
            Save Diary Entry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8 text-gray-500">
          <svg className="animate-spin h-6 w-6 mr-2 text-brand-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading diary entries...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📔</p>
          <p>No diary entries yet</p>
          <p className="text-sm mt-2">Start documenting your farming journey!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {entries.map((entry) => (
            <div key={entry.id} className="border rounded p-3 dark:border-gray-700 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getEntryIcon(entry.entry_type)}</span>
                  <span className="font-medium">{entry.title || entry.entry_type}</span>
                  {entry.metadata && entry.entry_type === 'expense' && entry.metadata.amount && (
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(entry.metadata.amount)}
                    </span>
                  )}
                  {entry.metadata && entry.entry_type === 'harvest' && (
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {entry.metadata.quantity} {entry.metadata.unit}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{entry.entry_date}</span>
              </div>
              
              <p className="text-sm whitespace-pre-wrap mb-2">{entry.content}</p>
              
              {/* Display expense details */}
              {entry.metadata && entry.entry_type === 'expense' && (
                <div className="mt-2 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  <div className="grid grid-cols-2 gap-2">
                    {entry.metadata.category && (
                      <div><span className="font-medium">Category:</span> {entry.metadata.category}</div>
                    )}
                    {entry.metadata.payment_method && (
                      <div><span className="font-medium">Paid via:</span> {entry.metadata.payment_method}</div>
                    )}
                    {entry.metadata.vendor && (
                      <div><span className="font-medium">Vendor:</span> {entry.metadata.vendor}</div>
                    )}
                    {entry.metadata.notes && (
                      <div className="col-span-2"><span className="font-medium">Notes:</span> {entry.metadata.notes}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Display harvest details */}
              {entry.metadata && entry.entry_type === 'harvest' && (
                <div className="mt-2 text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded">
                  <div className="grid grid-cols-2 gap-2">
                    {entry.metadata.quantity && (
                      <div><span className="font-medium">Quantity:</span> {entry.metadata.quantity} {entry.metadata.unit}</div>
                    )}
                    {entry.metadata.estimated_value && (
                      <div><span className="font-medium">Est. Value:</span> {formatCurrency(entry.metadata.estimated_value)}</div>
                    )}
                    {entry.metadata.actual_sales && (
                      <div><span className="font-medium">Sales:</span> {formatCurrency(entry.metadata.actual_sales)}</div>
                    )}
                    {entry.metadata.buyer && (
                      <div><span className="font-medium">Buyer:</span> {entry.metadata.buyer}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Display weather info if available */}
              {(entry.weather_condition || entry.temperature || entry.rainfall_mm) && (
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
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
