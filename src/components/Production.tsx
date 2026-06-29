import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, X } from 'lucide-react';

interface ProductionRecord {
  id: string;
  production_date: string;
  worker_id: string;
  quantity: number;
  worker?: {
    name: string;
    worker_id: string;
  };
}

interface Worker {
  id: string;
  worker_id: string;
  name: string;
}

export function Production() {
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduction, setEditingProduction] = useState<ProductionRecord | null>(null);

  const [formData, setFormData] = useState({
    production_date: new Date().toISOString().split('T')[0],
    worker_id: '',
    quantity: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productionRes, workersRes] = await Promise.all([
        supabase
          .from('production')
          .select('*, workers(name, worker_id)')
          .order('production_date', { ascending: false }),
        supabase.from('workers').select('id, worker_id, name').order('name'),
      ]);

      if (productionRes.error) throw productionRes.error;
      if (workersRes.error) throw workersRes.error;

      const productionsWithWorker = productionRes.data?.map((p) => ({
        ...p,
        worker: Array.isArray(p.workers) ? p.workers[0] : p.workers,
      })) || [];

      setProductions(productionsWithWorker);
      setWorkers(workersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProduction) {
        const productionData = {
          production_date: formData.production_date,
          worker_id: formData.worker_id,
          quantity: parseInt(formData.quantity),
        };

        const { error } = await supabase
          .from('production')
          .update(productionData)
          .eq('id', editingProduction.id);

        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('You must be authenticated to create a production record');
        }

        const productionData = {
          production_date: formData.production_date,
          worker_id: formData.worker_id,
          quantity: parseInt(formData.quantity),
          created_by: user.id,
        };

        const { error } = await supabase.from('production').insert([productionData]);

        if (error) throw error;
      }

      closeForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving production:', error);
      alert(`Error saving production record: ${error?.message || 'Please try again.'}`);
    }
  };

  const handleEdit = (production: ProductionRecord) => {
    setEditingProduction(production);
    setFormData({
      production_date: production.production_date,
      worker_id: production.worker_id,
      quantity: production.quantity.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this production record?')) return;

    try {
      const { error } = await supabase.from('production').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting production:', error);
      alert('Error deleting production record. Please try again.');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduction(null);
    setFormData({
      production_date: new Date().toISOString().split('T')[0],
      worker_id: '',
      quantity: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Production Management</h2>
          <p className="text-gray-600 mt-1">Track daily and weekly saree production</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-rose-700 text-white px-4 py-2 rounded-lg hover:bg-rose-800 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Add Production
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingProduction ? 'Edit Production' : 'Add Production Record'}
              </h3>
              <button onClick={closeForm} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Production Date</label>
                <input
                  type="date"
                  required
                  value={formData.production_date}
                  onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
                <select
                  required
                  value={formData.worker_id}
                  onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                >
                  <option value="">Select a worker</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.worker_id} - {worker.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Produced</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  placeholder="Number of sarees"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-700 text-white py-2 rounded-lg hover:bg-rose-800 transition"
                >
                  {editingProduction ? 'Update Production' : 'Add Production'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No production records found. Add your first production record to get started.
                  </td>
                </tr>
              ) : (
                productions.map((production) => (
                  <tr key={production.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(production.production_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {production.worker ? `${production.worker.worker_id} - ${production.worker.name}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {production.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(production)}
                        className="text-rose-600 hover:text-rose-800 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(production.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
