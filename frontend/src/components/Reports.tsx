import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, TrendingUp, Users, Package } from 'lucide-react';

interface ReportData {
  weeklyProduction: Array<{ worker_name: string; saree_type: string; quantity: number }>;
  workerProductivity: Array<{ worker_id: string; worker_name: string; total_production: number }>;
  inventoryUsage: Array<{ material_name: string; quantity: number; unit: string; total_cost: number }>;
  weeklySales: Array<{ buyer_name: string; location: string; quantity: number; total_amount: number }>;
  profitSummary: {
    totalRevenue: number;
    totalMaterialCost: number;
    grossProfit: number;
  };
}

export function Reports() {
  const [reportData, setReportData] = useState<ReportData>({
    weeklyProduction: [],
    workerProductivity: [],
    inventoryUsage: [],
    weeklySales: [],
    profitSummary: { totalRevenue: 0, totalMaterialCost: 0, grossProfit: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly-production');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];

      const [productionRes, salesRes, materialsRes] = await Promise.all([
        supabase
          .from('production')
          .select('quantity, saree_type, workers(name, worker_id)')
          .gte('production_date', weekAgoStr),
        supabase
          .from('sales')
          .select('buyer_name, location, quantity, total_amount')
          .gte('sale_date', weekAgoStr),
        supabase.from('raw_materials').select('material_name, quantity, unit, total_cost'),
      ]);

      const productionData = productionRes.data || [];
      const salesData = salesRes.data || [];
      const materialsData = materialsRes.data || [];

      const weeklyProduction = productionData.map((p) => ({
        worker_name: p.workers ? (Array.isArray(p.workers) ? p.workers[0]?.name : p.workers.name) : 'Unknown',
        saree_type: p.saree_type,
        quantity: p.quantity,
      }));

      const workerProductivityMap = new Map();
      productionData.forEach((p) => {
        const worker = p.workers ? (Array.isArray(p.workers) ? p.workers[0] : p.workers) : null;
        if (worker) {
          const key = worker.worker_id;
          if (!workerProductivityMap.has(key)) {
            workerProductivityMap.set(key, { worker_id: worker.worker_id, worker_name: worker.name, total_production: 0 });
          }
          workerProductivityMap.get(key).total_production += p.quantity;
        }
      });

      const workerProductivity = Array.from(workerProductivityMap.values()).sort(
        (a, b) => b.total_production - a.total_production
      );

      const inventoryUsage = materialsData.map((m) => ({
        material_name: m.material_name,
        quantity: Number(m.quantity),
        unit: m.unit,
        total_cost: Number(m.total_cost),
      }));

      const weeklySales = salesData.map((s) => ({
        buyer_name: s.buyer_name,
        location: s.location,
        quantity: s.quantity,
        total_amount: Number(s.total_amount),
      }));

      const totalRevenue = weeklySales.reduce((sum, s) => sum + s.total_amount, 0);
      const totalMaterialCost = inventoryUsage.reduce((sum, m) => sum + m.total_cost, 0);
      const grossProfit = totalRevenue - totalMaterialCost;

      setReportData({
        weeklyProduction,
        workerProductivity,
        inventoryUsage,
        weeklySales,
        profitSummary: { totalRevenue, totalMaterialCost, grossProfit },
      });
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'weekly-production', label: 'Weekly Production', icon: FileText },
    { id: 'worker-productivity', label: 'Worker Productivity', icon: Users },
    { id: 'inventory-usage', label: 'Inventory Usage', icon: Package },
    { id: 'weekly-sales', label: 'Weekly Sales', icon: TrendingUp },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports Dashboard</h2>
        <p className="text-gray-600 mt-1">View comprehensive business reports and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
          <p className="text-green-100 text-sm font-medium mb-1">Total Revenue (Weekly)</p>
          <p className="text-3xl font-bold">₹{reportData.profitSummary.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
          <p className="text-orange-100 text-sm font-medium mb-1">Material Cost</p>
          <p className="text-3xl font-bold">₹{reportData.profitSummary.totalMaterialCost.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <p className="text-blue-100 text-sm font-medium mb-1">Gross Profit</p>
          <p className="text-3xl font-bold">₹{reportData.profitSummary.grossProfit.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'weekly-production' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Production Report</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saree Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.weeklyProduction.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          No production data available for this week.
                        </td>
                      </tr>
                    ) : (
                      reportData.weeklyProduction.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.worker_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.saree_type}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.quantity}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'worker-productivity' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Worker Productivity Report</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Production (Weekly)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.workerProductivity.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          No productivity data available.
                        </td>
                      </tr>
                    ) : (
                      reportData.workerProductivity.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.worker_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.worker_name}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.total_production} sarees
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory-usage' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Inventory Usage Report</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.inventoryUsage.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          No inventory data available.
                        </td>
                      </tr>
                    ) : (
                      reportData.inventoryUsage.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.material_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            ₹{item.total_cost.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'weekly-sales' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Sales Report</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.weeklySales.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No sales data available for this week.
                        </td>
                      </tr>
                    ) : (
                      reportData.weeklySales.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.buyer_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.location}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            ₹{item.total_amount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
