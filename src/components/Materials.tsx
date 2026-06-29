import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, AlertTriangle, TrendingDown, Package, ShoppingCart, Zap } from 'lucide-react';

interface MaterialInventory {
  id: string;
  factory_id: string;
  factory_name: string;
  material_id: string;
  material_name: string;
  color_id?: string;
  color_name?: string;
  week_date: string;
  purchased_quantity: number;
  used_quantity: number;
  remaining_quantity: number;
  reorder_point?: number;
  supplier?: string;
  cost_per_unit?: number;
  total_cost?: number;
}

interface Material {
  id: string;
  material_name: string;
  category: string;
  unit: string;
  cost_per_unit: number;
}

interface MaterialStats {
  totalRecords: number;
  lowStock: number;
  totalPurchased: number;
  totalUsed: number;
  totalValue: number;
}

export default function Materials() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<MaterialInventory[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [factories, setFactories] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [stats, setStats] = useState<MaterialStats>({
    totalRecords: 0,
    lowStock: 0,
    totalPurchased: 0,
    totalUsed: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'purchase' | 'usage'>('purchase');
  const [showCostUpdate, setShowCostUpdate] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  
  const [purchaseForm, setPurchaseForm] = useState({
    factory_id: '',
    material_id: '',
    color_id: '',
    quantity: 0,
    supplier: '',
    cost_per_unit: 0,
  });

  const [usageForm, setUsageForm] = useState({
    factory_id: '',
    material_id: '',
    color_id: '',
    quantity: 0,
  });

  const [costUpdateForm, setCostUpdateForm] = useState({
    material_id: '',
    cost_per_unit: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: factoriesData } = await supabase.from('factories').select('*');
      setFactories(factoriesData || []);

      const { data: materialsData } = await supabase.from('material_types').select('*');
      setMaterials(materialsData || []);

      const { data: colorsData } = await supabase.from('cone_colors').select('*');
      setColors(colorsData || []);

      const { data: inventoryData } = await supabase
        .from('material_inventory')
        .select(`
          *,
          factory:factories(factory_name),
          material:material_types(material_name),
          color:cone_colors(color_name, color_code, section)
        `)
        .order('week_date', { ascending: false })
        .limit(100);

      if (inventoryData) {
        const formatted = inventoryData.map((item: any) => ({
          id: item.id,
          factory_id: item.factory_id,
          factory_name: item.factory?.factory_name,
          material_id: item.material_id,
          material_name: item.material?.material_name,
          color_id: item.color_id,
          color_name: item.color?.color_name,
          week_date: item.week_date,
          purchased_quantity: item.purchased_quantity,
          used_quantity: item.used_quantity,
          remaining_quantity: item.remaining_quantity,
          reorder_point: item.reorder_point,
          supplier: item.supplier,
          cost_per_unit: item.cost_per_unit,
          total_cost: item.total_cost,
        }));
        setInventory(formatted);
        calculateStats(formatted);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading materials data:', error);
      setLoading(false);
    }
  };

  const calculateStats = (data: MaterialInventory[]) => {
    const totalPurchased = data.reduce((sum, item) => sum + item.purchased_quantity, 0);
    const totalUsed = data.reduce((sum, item) => sum + item.used_quantity, 0);
    const totalValue = data.reduce((sum, item) => sum + (item.total_cost || 0), 0);

    setStats({
      totalRecords: data.length,
      lowStock: data.filter((item) => item.remaining_quantity <= 10).length,
      totalPurchased,
      totalUsed,
      totalValue,
    });
  };

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.factory_id || !purchaseForm.material_id) {
      alert('Please select factory and material');
      return;
    }

    const totalCost = purchaseForm.cost_per_unit * purchaseForm.quantity;

    try {
      const { data: existingData } = await supabase
        .from('material_inventory')
        .select('*')
        .eq('factory_id', purchaseForm.factory_id)
        .eq('material_id', purchaseForm.material_id)
        .eq('color_id', purchaseForm.color_id || null)
        .eq('week_date', new Date().toISOString().split('T')[0])
        .single();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('material_inventory')
          .update({
            purchased_quantity: existingData.purchased_quantity + purchaseForm.quantity,
            remaining_quantity: (existingData.purchased_quantity + purchaseForm.quantity) - existingData.used_quantity,
            total_cost: totalCost + (existingData.total_cost || 0),
            supplier: purchaseForm.supplier,
            cost_per_unit: purchaseForm.cost_per_unit,
          })
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase.from('material_inventory').insert([
          {
            factory_id: purchaseForm.factory_id,
            material_id: purchaseForm.material_id,
            color_id: purchaseForm.color_id || null,
            week_date: new Date().toISOString().split('T')[0],
            purchased_quantity: purchaseForm.quantity,
            used_quantity: 0,
            remaining_quantity: purchaseForm.quantity,
            supplier: purchaseForm.supplier,
            cost_per_unit: purchaseForm.cost_per_unit,
            total_cost: totalCost,
            created_by: user?.id,
          },
        ]);

        if (error) throw error;
      }

      setPurchaseForm({
        factory_id: '',
        material_id: '',
        color_id: '',
        quantity: 0,
        supplier: '',
        cost_per_unit: 0,
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error recording purchase:', error);
      alert('Failed to record purchase');
    }
  };

  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageForm.factory_id || !usageForm.material_id) {
      alert('Please select factory and material');
      return;
    }

    try {
      const { data: existingData } = await supabase
        .from('material_inventory')
        .select('*')
        .eq('factory_id', usageForm.factory_id)
        .eq('material_id', usageForm.material_id)
        .eq('color_id', usageForm.color_id || null)
        .eq('week_date', new Date().toISOString().split('T')[0])
        .single();

      if (existingData) {
        const newUsed = Math.min(existingData.used_quantity + usageForm.quantity, existingData.purchased_quantity);
        const remaining = existingData.purchased_quantity - newUsed;

        const { error } = await supabase
          .from('material_inventory')
          .update({
            used_quantity: newUsed,
            remaining_quantity: remaining,
          })
          .eq('id', existingData.id);

        if (error) throw error;
      }

      setUsageForm({
        factory_id: '',
        material_id: '',
        color_id: '',
        quantity: 0,
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error recording usage:', error);
      alert('Failed to record usage');
    }
  };

  const handleUpdateCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!costUpdateForm.material_id) {
      alert('Please select a material');
      return;
    }

    try {
      const { error } = await supabase
        .from('material_types')
        .update({ cost_per_unit: costUpdateForm.cost_per_unit })
        .eq('id', costUpdateForm.material_id);

      if (error) throw error;
      setCostUpdateForm({ material_id: '', cost_per_unit: 0 });
      setShowCostUpdate(false);
      loadData();
    } catch (error) {
      console.error('Error updating cost:', error);
      alert('Failed to update cost');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Delete this record?')) return;

    try {
      const { error } = await supabase.from('material_inventory').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="section-title">Materials Inventory</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCostUpdate(true)} className="btn-secondary flex items-center gap-2">
            <Package className="w-4 h-4" />
            Set Material Cost
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Record Material
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="stat-card bg-gradient-to-br from-blue-600 to-blue-700">
          <Package className="w-8 h-8 text-white/80 mb-2" />
          <h3 className="text-white/80 text-sm">Total Records</h3>
          <p className="text-3xl font-bold text-white">{stats.totalRecords}</p>
        </div>
        <div className="stat-card bg-gradient-to-br from-green-600 to-green-700">
          <ShoppingCart className="w-8 h-8 text-white/80 mb-2" />
          <h3 className="text-white/80 text-sm">Total Purchased</h3>
          <p className="text-3xl font-bold text-white">{stats.totalPurchased}</p>
        </div>
        <div className="stat-card bg-gradient-to-br from-Orange-600 to-Orange-700">
          <Zap className="w-8 h-8 text-white/80 mb-2" />
          <h3 className="text-white/80 text-sm">Total Used</h3>
          <p className="text-3xl font-bold text-white">{stats.totalUsed}</p>
        </div>
        <div className="stat-card bg-gradient-to-br from-red-600 to-red-700">
          <AlertTriangle className="w-8 h-8 text-white/80 mb-2" />
          <h3 className="text-white/80 text-sm">Low Stock</h3>
          <p className="text-3xl font-bold text-white">{stats.lowStock}</p>
        </div>
        <div className="stat-card bg-gradient-to-br from-purple-600 to-purple-700">
          <TrendingDown className="w-8 h-8 text-white/80 mb-2" />
          <h3 className="text-white/80 text-sm">Total Value</h3>
          <p className="text-3xl font-bold text-white">₹{stats.totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Cost Update Form */}
      {showCostUpdate && (
        <div className="glass-effect p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Set Material Cost</h2>
          <form onSubmit={handleUpdateCost} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={costUpdateForm.material_id}
                onChange={(e) => setCostUpdateForm({ ...costUpdateForm, material_id: e.target.value })}
                className="input-field"
              >
                <option value="">Select Material</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.material_name} (Current: ₹{m.cost_per_unit})
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Cost Per Unit (₹)"
                value={costUpdateForm.cost_per_unit}
                onChange={(e) => setCostUpdateForm({ ...costUpdateForm, cost_per_unit: parseFloat(e.target.value) || 0 })}
                className="input-field"
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">
                Update Cost
              </button>
              <button type="button" onClick={() => setShowCostUpdate(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recording Forms */}
      {showForm && (
        <div className="glass-effect p-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/20">
            <button
              onClick={() => setActiveTab('purchase')}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === 'purchase'
                  ? 'border-b-2 border-purple-500 text-purple-400'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              Record Purchase
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === 'usage'
                  ? 'border-b-2 border-purple-500 text-purple-400'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Record Usage
            </button>
          </div>

          {activeTab === 'purchase' && (
            <form onSubmit={handleRecordPurchase} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={purchaseForm.factory_id}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, factory_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Factory</option>
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.factory_name}
                    </option>
                  ))}
                </select>

                <select
                  value={purchaseForm.material_id}
                  onChange={(e) => {
                    setPurchaseForm({ ...purchaseForm, material_id: e.target.value });
                    setSelectedMaterial(e.target.value);
                  }}
                  className="input-field"
                >
                  <option value="">Select Material</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.material_name}
                    </option>
                  ))}
                </select>

                {selectedMaterial && colors.length > 0 && (
                  <select
                    value={purchaseForm.color_id}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, color_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Color (Optional)</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.color_name} ({c.section})
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="number"
                  placeholder="Quantity Purchased"
                  value={purchaseForm.quantity}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, quantity: parseFloat(e.target.value) || 0 })
                  }
                  className="input-field"
                  min="0"
                />

                <input
                  type="text"
                  placeholder="Supplier Name"
                  value={purchaseForm.supplier}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                  className="input-field"
                />

                <input
                  type="number"
                  placeholder="Cost Per Unit (₹)"
                  value={purchaseForm.cost_per_unit}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, cost_per_unit: parseFloat(e.target.value) || 0 })
                  }
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="bg-white/10 p-3 rounded text-white text-sm">
                Total Cost: ₹{(purchaseForm.quantity * purchaseForm.cost_per_unit).toLocaleString()}
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  Record Purchase
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {activeTab === 'usage' && (
            <form onSubmit={handleRecordUsage} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={usageForm.factory_id}
                  onChange={(e) => setUsageForm({ ...usageForm, factory_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Factory</option>
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.factory_name}
                    </option>
                  ))}
                </select>

                <select
                  value={usageForm.material_id}
                  onChange={(e) => {
                    setUsageForm({ ...usageForm, material_id: e.target.value });
                    setSelectedMaterial(e.target.value);
                  }}
                  className="input-field"
                >
                  <option value="">Select Material</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.material_name}
                    </option>
                  ))}
                </select>

                {selectedMaterial && colors.length > 0 && (
                  <select
                    value={usageForm.color_id}
                    onChange={(e) => setUsageForm({ ...usageForm, color_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Color (Optional)</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.color_name} ({c.section})
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="number"
                  placeholder="Quantity Used"
                  value={usageForm.quantity}
                  onChange={(e) =>
                    setUsageForm({ ...usageForm, quantity: parseFloat(e.target.value) || 0 })
                  }
                  className="input-field"
                  min="0"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  Record Usage
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Inventory Table */}
      <div className="glass-effect p-6">
        <h2 className="text-xl font-bold text-white mb-4">Weekly Inventory Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-white text-sm">
            <thead className="border-b border-white/20">
              <tr>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Factory</th>
                <th className="text-left py-3 px-4">Material</th>
                <th className="text-left py-3 px-4">Color</th>
                <th className="text-right py-3 px-4">Purchased</th>
                <th className="text-right py-3 px-4">Used</th>
                <th className="text-right py-3 px-4">Remaining</th>
                <th className="text-right py-3 px-4">Cost/Unit</th>
                <th className="text-right py-3 px-4">Total Cost</th>
                <th className="text-center py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-white/10 hover:bg-white/5 transition"
                >
                  <td className="py-3 px-4">{new Date(item.week_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{item.factory_name}</td>
                  <td className="py-3 px-4">{item.material_name}</td>
                  <td className="py-3 px-4">
                    {item.color_name ? (
                      <span
                        className="inline-block px-2 py-1 rounded text-white text-xs font-semibold"
                        style={{
                          backgroundColor:
                            colors.find((c) => c.color_name === item.color_name)?.color_code || '#666',
                        }}
                      >
                        {item.color_name}
                      </span>
                    ) : (
                      <span className="text-white/50">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">{item.purchased_quantity}</td>
                  <td className="py-3 px-4 text-right">{item.used_quantity}</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {item.remaining_quantity}
                    {item.remaining_quantity <= 10 && (
                      <span className="ml-2 text-red-400">⚠</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">₹{item.cost_per_unit?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4 text-right">₹{item.total_cost?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeleteRecord(item.id)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
