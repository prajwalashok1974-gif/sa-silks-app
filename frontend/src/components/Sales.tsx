import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, X } from 'lucide-react';

interface Sale {
  id: string;
  sale_date: string;
  buyer_name: string;
  location: string;
  saree_type: string;
  quantity: number;
  price_per_unit: number;
  total_amount: number;
}

export function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [formData, setFormData] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    buyer_name: '',
    location: '',
    saree_type: '',
    quantity: '',
    price_per_unit: '',
  });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = parseInt(formData.quantity);
    const pricePerUnit = parseFloat(formData.price_per_unit);
    const totalAmount = quantity * pricePerUnit;

    try {
      if (editingSale) {
        const saleData = {
          sale_date: formData.sale_date,
          buyer_name: formData.buyer_name,
          location: formData.location,
          saree_type: formData.saree_type,
          quantity,
          price_per_unit: pricePerUnit,
          total_amount: totalAmount,
        };

        const { error } = await supabase.from('sales').update(saleData).eq('id', editingSale.id);

        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('You must be authenticated to create a sale record');
        }

        const saleData = {
          sale_date: formData.sale_date,
          buyer_name: formData.buyer_name,
          location: formData.location,
          saree_type: formData.saree_type,
          quantity,
          price_per_unit: pricePerUnit,
          total_amount: totalAmount,
          created_by: user.id,
        };

        const { error } = await supabase.from('sales').insert([saleData]);

        if (error) throw error;
      }

      closeForm();
      loadSales();
    } catch (error: any) {
      console.error('Error saving sale:', error);
      alert(`Error saving sale record: ${error?.message || 'Please try again.'}`);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      sale_date: sale.sale_date,
      buyer_name: sale.buyer_name,
      location: sale.location,
      saree_type: sale.saree_type,
      quantity: sale.quantity.toString(),
      price_per_unit: sale.price_per_unit.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sale record?')) return;

    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
      loadSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Error deleting sale record. Please try again.');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSale(null);
    setFormData({
      sale_date: new Date().toISOString().split('T')[0],
      buyer_name: '',
      location: '',
      saree_type: '',
      quantity: '',
      price_per_unit: '',
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
          <h2 className="text-2xl font-bold text-gray-800">Sales Management</h2>
          <p className="text-gray-600 mt-1">Track saree sales and revenue</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-rose-700 text-white px-4 py-2 rounded-lg hover:bg-rose-800 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Add Sale
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingSale ? 'Edit Sale' : 'Add Sale Record'}
              </h3>
              <button onClick={closeForm} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                <input
                  type="date"
                  required
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                <input
                  type="text"
                  required
                  value={formData.buyer_name}
                  onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  placeholder="Buyer or dealer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  placeholder="City or region"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saree Type</label>
                <input
                  type="text"
                  required
                  value={formData.saree_type}
                  onChange={(e) => setFormData({ ...formData, saree_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  placeholder="e.g., Silk Saree, Cotton Saree"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  placeholder="Number of sarees sold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Saree (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price_per_unit}
                  onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  placeholder="500"
                />
              </div>

              {formData.quantity && formData.price_per_unit && (
                <div className="bg-rose-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-bold text-rose-700">
                    ₹{(parseInt(formData.quantity) * parseFloat(formData.price_per_unit)).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-700 text-white py-2 rounded-lg hover:bg-rose-800 transition"
                >
                  {editingSale ? 'Update Sale' : 'Add Sale'}
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
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saree Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No sales records found. Add your first sale to get started.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.buyer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {sale.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {sale.saree_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ₹{Number(sale.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(sale)}
                        className="text-rose-600 hover:text-rose-800 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(sale.id)}
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
