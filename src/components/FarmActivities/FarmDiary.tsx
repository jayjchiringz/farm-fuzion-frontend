// farm-fuzion-frontend/src/components/FarmActivities/FarmDiary.tsx
import React, { useState, useEffect } from "react";
import { farmActivitiesApi, FarmDiaryEntry, FarmSeason } from "../../services/farmActivitiesApi";
import { Edit, Trash2, X, Check, Save } from "lucide-react";

interface FarmDiaryProps {
  farmerId: number;
  seasons?: FarmSeason[];
}

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
  // Amount/Value tracking
  estimated_value?: number;      // Expected value before harvest
  actual_sales?: number;         // Actual money received from sales
  direct_sales_amount?: number;  // Money from direct farmgate sales
  market_sales_amount?: number;  // Money from market sales
  cooperative_sales_amount?: number; // Money from cooperative sales
  other_income?: number;         // Any other harvest-related income
  total_harvest_value?: number;  // Calculated total value
  buyer?: string;
  market_location?: string;
  sale_date?: string;
}

export const FarmDiary: React.FC<FarmDiaryProps> = ({ farmerId, seasons = [] }) => {
  const [entries, setEntries] = useState<FarmDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FarmDiaryEntry | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [financialSummary, setFinancialSummary] = useState({
    totalExpenses: 0,
    totalHarvestValue: 0,
    totalSales: 0,
    netProfit: 0,
    totalEstimatedValue: 0,
    pendingSales: 0
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
      direct_sales_amount: 0,
      market_sales_amount: 0,
      cooperative_sales_amount: 0,
      other_income: 0,
      total_harvest_value: 0,
      buyer: "",
      market_location: "",
      sale_date: new Date().toISOString().split('T')[0]
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
    let estimatedValue = 0;
    let pendingSales = 0;

    entries.forEach(entry => {
      if (entry.metadata) {
        // Calculate expenses
        if (entry.entry_type === 'expense' && entry.metadata.amount) {
          expenses += Number(entry.metadata.amount);
        }
        
        // Calculate harvest values
        if (entry.entry_type === 'harvest') {
          // Estimated value
          if (entry.metadata.estimated_value) {
            estimatedValue += Number(entry.metadata.estimated_value);
            harvestValue += Number(entry.metadata.estimated_value);
          }
          
          // Actual sales from various sources
          let totalSales = 0;
          if (entry.metadata.actual_sales) {
            totalSales += Number(entry.metadata.actual_sales);
          }
          if (entry.metadata.direct_sales_amount) {
            totalSales += Number(entry.metadata.direct_sales_amount);
          }
          if (entry.metadata.market_sales_amount) {
            totalSales += Number(entry.metadata.market_sales_amount);
          }
          if (entry.metadata.cooperative_sales_amount) {
            totalSales += Number(entry.metadata.cooperative_sales_amount);
          }
          if (entry.metadata.other_income) {
            totalSales += Number(entry.metadata.other_income);
          }
          
          sales += totalSales;
          
          // Calculate pending sales (estimated - actual)
          if (entry.metadata.estimated_value && totalSales < entry.metadata.estimated_value) {
            pendingSales += (entry.metadata.estimated_value - totalSales);
          }
        }
      }
    });

    setFinancialSummary({
      totalExpenses: expenses,
      totalHarvestValue: harvestValue,
      totalSales: sales,
      netProfit: sales - expenses,
      totalEstimatedValue: estimatedValue,
      pendingSales: pendingSales
    });
  };

  const calculateHarvestTotal = (details: HarvestDetails): number => {
    const direct = details.direct_sales_amount || 0;
    const market = details.market_sales_amount || 0;
    const coop = details.cooperative_sales_amount || 0;
    const other = details.other_income || 0;
    const actual = details.actual_sales || 0;
    
    return direct + market + coop + other + actual;
  };

  const handleEdit = (entry: FarmDiaryEntry) => {
    setEditingEntry(entry);
    setShowNewEntry(false);
    setDeleteConfirm(null);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;
    
    try {
      console.log("Updating entry:", editingEntry);
      
      // Prepare the update payload
      const updatePayload: any = {
        title: editingEntry.title,
        content: editingEntry.content,
        entry_date: editingEntry.entry_date,
        entry_type: editingEntry.entry_type,
        metadata: editingEntry.metadata
      };
      
      // Remove undefined values
      Object.keys(updatePayload).forEach(key => 
        updatePayload[key] === undefined && delete updatePayload[key]
      );
      
      await farmActivitiesApi.updateDiaryEntry(editingEntry.id!, updatePayload);
      setEditingEntry(null);
      loadEntries();
      alert("Entry updated successfully!");
    } catch (error) {
      console.error("Error updating entry:", error);
      alert("Failed to update entry. Please check the data and try again.");
    }
  };

  const handleDelete = async (entryId: number) => {
    try {
      await farmActivitiesApi.deleteDiaryEntry(entryId);
      setDeleteConfirm(null);
      loadEntries();
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete entry");
    }
  };

  const createEntry = async () => {
    if (!newEntry.content) {
      alert("Please enter diary content");
      return;
    }

    const metadata: any = {};
    
    if (newEntry.entry_type === 'expense' && newEntry.expense_details) {
      metadata.amount = newEntry.expense_details.amount;
      metadata.category = newEntry.expense_details.category;
      metadata.payment_method = newEntry.expense_details.payment_method;
      metadata.vendor = newEntry.expense_details.vendor;
      metadata.notes = newEntry.expense_details.notes;
    }
    
    if (newEntry.entry_type === 'harvest' && newEntry.harvest_details) {
      // Calculate total harvest value
      const totalValue = calculateHarvestTotal(newEntry.harvest_details);
      
      metadata.quantity = newEntry.harvest_details.quantity;
      metadata.unit = newEntry.harvest_details.unit;
      metadata.estimated_value = newEntry.harvest_details.estimated_value;
      metadata.actual_sales = newEntry.harvest_details.actual_sales;
      metadata.direct_sales_amount = newEntry.harvest_details.direct_sales_amount;
      metadata.market_sales_amount = newEntry.harvest_details.market_sales_amount;
      metadata.cooperative_sales_amount = newEntry.harvest_details.cooperative_sales_amount;
      metadata.other_income = newEntry.harvest_details.other_income;
      metadata.total_harvest_value = totalValue;
      metadata.buyer = newEntry.harvest_details.buyer;
      metadata.market_location = newEntry.harvest_details.market_location;
      metadata.sale_date = newEntry.harvest_details.sale_date;
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
      resetNewEntry();
      loadEntries();
    } catch (error) {
      console.error("Error creating diary entry:", error);
      alert("Failed to save diary entry");
    }
  };

  const resetNewEntry = () => {
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
        direct_sales_amount: 0,
        market_sales_amount: 0,
        cooperative_sales_amount: 0,
        other_income: 0,
        total_harvest_value: 0,
        buyer: "",
        market_location: "",
        sale_date: new Date().toISOString().split('T')[0]
      }
    });
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

  const marketLocations = [
    "farmgate", "local_market", "wholesale", "cooperative", "direct_buyer", "other"
  ];

  const renderEditForm = () => {
    if (!editingEntry) return null;

    return (
      <div className="border-2 border-blue-300 rounded p-4 mb-4 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-blue-600 dark:text-blue-400">Edit Entry</h4>
          <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={editingEntry.title || ''}
            onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
            placeholder="Title"
            className="w-full p-2 border rounded dark:bg-gray-800"
          />
          
          <textarea
            value={editingEntry.content}
            onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
            placeholder="Content"
            rows={3}
            className="w-full p-2 border rounded dark:bg-gray-800"
          />

          {editingEntry.entry_type === 'expense' && editingEntry.metadata && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={editingEntry.metadata.amount || ''}
                onChange={(e) => setEditingEntry({
                  ...editingEntry,
                  metadata: { ...editingEntry.metadata, amount: parseFloat(e.target.value) } as any
                })}
                placeholder="Amount"
                className="p-2 border rounded dark:bg-gray-800"
              />
              <select
                value={editingEntry.metadata.category || 'inputs'}
                onChange={(e) => setEditingEntry({
                  ...editingEntry,
                  metadata: { ...editingEntry.metadata, category: e.target.value } as any
                })}
                className="p-2 border rounded dark:bg-gray-800"
              >
                {expenseCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {editingEntry.entry_type === 'harvest' && editingEntry.metadata && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={editingEntry.metadata.quantity || ''}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    metadata: { ...editingEntry.metadata, quantity: parseFloat(e.target.value) } as any
                  })}
                  placeholder="Quantity"
                  className="p-2 border rounded dark:bg-gray-800"
                />
                <select
                  value={editingEntry.metadata.unit || 'kg'}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    metadata: { ...editingEntry.metadata, unit: e.target.value } as any
                  })}
                  className="p-2 border rounded dark:bg-gray-800"
                >
                  {harvestUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={editingEntry.metadata.estimated_value || ''}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    metadata: { ...editingEntry.metadata, estimated_value: parseFloat(e.target.value) } as any
                  })}
                  placeholder="Estimated Value (Ksh)"
                  className="p-2 border rounded dark:bg-gray-800"
                />
                <input
                  type="number"
                  value={editingEntry.metadata.actual_sales || ''}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    metadata: { ...editingEntry.metadata, actual_sales: parseFloat(e.target.value) } as any
                  })}
                  placeholder="Actual Sales (Ksh)"
                  className="p-2 border rounded dark:bg-gray-800"
                />
              </div>

              <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mt-2">Sales Breakdown</h5>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={editingEntry.metadata.direct_sales_amount || ''}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    metadata: { ...editingEntry.metadata, direct_sales_amount: parseFloat(e.target.value) } as any
                  })}
                  placeholder="Direct Sales"
                  className="p-2 border rounded dark:bg-gray-800"
                />
                <input
                  type="number"
                  value={editingEntry.metadata.market_sales_amount || ''}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    metadata: { ...editingEntry.metadata, market_sales_amount: parseFloat(e.target.value) } as any
                  })}
                  placeholder="Market Sales"
                  className="p-2 border rounded dark:bg-gray-800"
                />
                <input
                  type="number"
                  value={editingEntry.metadata.cooperative_sales_amount || ''}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    metadata: { ...editingEntry.metadata, cooperative_sales_amount: parseFloat(e.target.value) } as any
                  })}
                  placeholder="Cooperative Sales"
                  className="p-2 border rounded dark:bg-gray-800"
                />
                <input
                  type="number"
                  value={editingEntry.metadata.other_income || ''}
                  onChange={(e) => setEditingEntry({
                    ...editingEntry,
                    metadata: { ...editingEntry.metadata, other_income: parseFloat(e.target.value) } as any
                  })}
                  placeholder="Other Income"
                  className="p-2 border rounded dark:bg-gray-800"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={16} /> Update
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="farm-diary p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-brand-dark dark:text-brand-apple">
          📓 Farm Diary
        </h3>
        <button
          onClick={() => {
            setShowNewEntry(!showNewEntry);
            setEditingEntry(null);
          }}
          className="bg-brand-green text-white px-3 py-1 rounded text-sm hover:bg-brand-dark"
        >
          {showNewEntry ? "✕ Cancel" : "+ New Entry"}
        </button>
      </div>

      {/* Enhanced Financial Summary Cards */}
      {entries.length > 0 && (
        <>
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

          {/* Additional Harvest Insights */}
          {financialSummary.pendingSales > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Pending Sales: {formatCurrency(financialSummary.pendingSales)} worth of harvest not yet sold
              </div>
            </div>
          )}
        </>
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

      {/* New Entry Form */}
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

          {/* Expense fields */}
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
            </div>
          )}

          {/* Enhanced Harvest fields with amount tracking */}
          {newEntry.entry_type === 'harvest' && (
            <div className="space-y-3 mb-3 p-3 bg-white dark:bg-gray-900 rounded border">
              <h4 className="font-medium text-sm text-brand-green">🌾 Harvest Details</h4>
              
              {/* Basic harvest info */}
              <div className="grid grid-cols-2 gap-3">
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
              </div>

              {/* Value estimates */}
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-xs mb-1">Total Actual Sales (Ksh)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Auto-calculated"
                    value={calculateHarvestTotal(newEntry.harvest_details || {})}
                    className="w-full p-2 border rounded text-sm bg-gray-100 dark:bg-gray-700"
                    readOnly
                  />
                </div>
              </div>

              {/* Sales breakdown */}
              <h5 className="font-medium text-xs text-gray-600 dark:text-gray-400 mt-2">Sales Breakdown</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">Direct Farmgate Sales</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={newEntry.harvest_details?.direct_sales_amount || ''}
                    onChange={(e) => setNewEntry({
                      ...newEntry,
                      harvest_details: {
                        ...newEntry.harvest_details,
                        direct_sales_amount: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Market Sales</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={newEntry.harvest_details?.market_sales_amount || ''}
                    onChange={(e) => setNewEntry({
                      ...newEntry,
                      harvest_details: {
                        ...newEntry.harvest_details,
                        market_sales_amount: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Cooperative Sales</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={newEntry.harvest_details?.cooperative_sales_amount || ''}
                    onChange={(e) => setNewEntry({
                      ...newEntry,
                      harvest_details: {
                        ...newEntry.harvest_details,
                        cooperative_sales_amount: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Other Income</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={newEntry.harvest_details?.other_income || ''}
                    onChange={(e) => setNewEntry({
                      ...newEntry,
                      harvest_details: {
                        ...newEntry.harvest_details,
                        other_income: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                  />
                </div>
              </div>

              {/* Sale details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">Buyer</label>
                  <input
                    type="text"
                    placeholder="e.g. John's Store"
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
                <div>
                  <label className="block text-xs mb-1">Market Location</label>
                  <select
                    value={newEntry.harvest_details?.market_location || 'farmgate'}
                    onChange={(e) => setNewEntry({
                      ...newEntry,
                      harvest_details: {
                        ...newEntry.harvest_details,
                        market_location: e.target.value
                      }
                    })}
                    className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                  >
                    {marketLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">Sale Date</label>
                  <input
                    type="date"
                    value={newEntry.harvest_details?.sale_date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewEntry({
                      ...newEntry,
                      harvest_details: {
                        ...newEntry.harvest_details,
                        sale_date: e.target.value
                      }
                    })}
                    className="w-full p-2 border rounded text-sm dark:bg-gray-800"
                  />
                </div>
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

      {/* Edit Form */}
      {renderEditForm()}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">Confirm Delete</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to delete this diary entry? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
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
            <div key={entry.id} className="border rounded p-3 dark:border-gray-700 hover:shadow-sm transition-shadow relative group">
              {!editingEntry && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(entry.id!)}
                    className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl">{getEntryIcon(entry.entry_type)}</span>
                  <span className="font-medium">{entry.title || entry.entry_type}</span>
                  {entry.metadata && entry.entry_type === 'expense' && entry.metadata.amount && (
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(entry.metadata.amount)}
                    </span>
                  )}
                  {entry.metadata && entry.entry_type === 'harvest' && (
                    <>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {entry.metadata.quantity} {entry.metadata.unit}
                      </span>
                      {entry.metadata.total_harvest_value ? (
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(entry.metadata.total_harvest_value)}
                        </span>
                      ) : entry.metadata.actual_sales ? (
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(entry.metadata.actual_sales)}
                        </span>
                      ) : null}
                    </>
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
                  </div>
                </div>
              )}

              {/* Enhanced harvest details display */}
              {entry.metadata && entry.entry_type === 'harvest' && (
                <div className="mt-2 text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded">
                  <div className="grid grid-cols-2 gap-2">
                    {entry.metadata.quantity && (
                      <div><span className="font-medium">Quantity:</span> {entry.metadata.quantity} {entry.metadata.unit}</div>
                    )}
                    {entry.metadata.estimated_value && (
                      <div><span className="font-medium">Est. Value:</span> {formatCurrency(entry.metadata.estimated_value)}</div>
                    )}
                    
                    {/* Sales breakdown */}
                    {entry.metadata.direct_sales_amount ? (
                      <div><span className="font-medium">Direct Sales:</span> {formatCurrency(entry.metadata.direct_sales_amount)}</div>
                    ) : null}
                    {entry.metadata.market_sales_amount ? (
                      <div><span className="font-medium">Market Sales:</span> {formatCurrency(entry.metadata.market_sales_amount)}</div>
                    ) : null}
                    {entry.metadata.cooperative_sales_amount ? (
                      <div><span className="font-medium">Co-op Sales:</span> {formatCurrency(entry.metadata.cooperative_sales_amount)}</div>
                    ) : null}
                    {entry.metadata.other_income ? (
                      <div><span className="font-medium">Other Income:</span> {formatCurrency(entry.metadata.other_income)}</div>
                    ) : null}
                    
                    {/* Total sales */}
                    {entry.metadata.total_harvest_value ? (
                      <div className="col-span-2 font-semibold">
                        <span className="font-medium">Total Sales:</span> {formatCurrency(entry.metadata.total_harvest_value)}
                      </div>
                    ) : entry.metadata.actual_sales ? (
                      <div className="col-span-2 font-semibold">
                        <span className="font-medium">Total Sales:</span> {formatCurrency(entry.metadata.actual_sales)}
                      </div>
                    ) : null}
                    
                    {entry.metadata.buyer && (
                      <div><span className="font-medium">Buyer:</span> {entry.metadata.buyer}</div>
                    )}
                    {entry.metadata.market_location && (
                      <div><span className="font-medium">Market:</span> {entry.metadata.market_location}</div>
                    )}
                    {entry.metadata.sale_date && (
                      <div><span className="font-medium">Sale Date:</span> {entry.metadata.sale_date}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Weather info */}
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
