import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Send, X, RefreshCw, Wallet, TrendingDown, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface WorkerPayment {
  id: string;
  worker_id: string;
  worker?: {
    name: string;
  };
  payment_week: string;
  sarees_produced: number;
  rate_per_saree: number;
  weekly_amount: number;
  amount_paid: number;
  amount_remaining: number;
  status: string;
}

interface PaymentAdvance {
  id: string;
  worker_payment_id: string;
  advance_amount: number;
  advance_date: string;
  notes: string;
}

const RATE_PER_SAREE = 220;

export function Payments() {
  const [payments, setPayments] = useState<WorkerPayment[]>([]);
  const [advances, setAdvances] = useState<PaymentAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<WorkerPayment | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0]);

  const [advanceFormData, setAdvanceFormData] = useState({
    advance_amount: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedWeek]);

  const loadData = async () => {
    try {
      // Get week start date (Monday)
      const date = new Date(selectedWeek);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(date.setDate(diff));
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      const [productionRes, workersRes, paymentRes] = await Promise.all([
        supabase
          .from('production')
          .select('worker_id, quantity')
          .gte('production_date', weekStartStr)
          .lte('production_date', weekEndStr),
        supabase.from('workers').select('id, worker_id, name').order('name'),
        supabase
          .from('worker_payments')
          .select('*')
          .eq('payment_week', weekStartStr),
      ]);

      if (productionRes.error) throw productionRes.error;
      if (workersRes.error) throw workersRes.error;
      if (paymentRes.error) throw paymentRes.error;


      // Group production by worker
      const productionByWorker: Record<string, number> = {};
      (productionRes.data || []).forEach((p) => {
        productionByWorker[p.worker_id] = (productionByWorker[p.worker_id] || 0) + p.quantity;
      });

      // Create payment records from production
      const paymentRecords: WorkerPayment[] = (workersRes.data || []).map((worker) => {
        const sareesProd = productionByWorker[worker.id] || 0;
        const weeklyAmt = sareesProd * RATE_PER_SAREE;
        
        const existing = (paymentRes.data || []).find(p => p.worker_id === worker.id);
        
        return {
          id: existing?.id || '',
          worker_id: worker.id,
          worker: { name: worker.name },
          payment_week: weekStartStr,
          sarees_produced: sareesProd,
          rate_per_saree: RATE_PER_SAREE,
          weekly_amount: weeklyAmt,
          amount_paid: existing?.amount_paid || 0,
          amount_remaining: existing?.amount_remaining || weeklyAmt,
          status: existing?.status || 'pending',
        };
      });

      setPayments(paymentRecords);
      
      if (selectedPayment) {
        const updated = paymentRecords.find(p => p.worker_id === selectedPayment.worker_id);
        if (updated) {
          setSelectedPayment(updated);
          loadAdvances(updated.id);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdvances = async (paymentId: string) => {
    if (!paymentId) return;
    try {
      const { data, error } = await supabase
        .from('payment_advances')
        .select('*')
        .eq('worker_payment_id', paymentId)
        .order('advance_date', { ascending: false });

      if (error) throw error;
      setAdvances(data || []);
    } catch (error) {
      console.error('Error loading advances:', error);
    }
  };

  const createOrUpdatePaymentRecord = async (payment: WorkerPayment) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('You must be authenticated');

      if (payment.id) {
        // Update existing
        const { error } = await supabase
          .from('worker_payments')
          .update({
            weekly_amount: payment.weekly_amount,
            amount_remaining: payment.amount_remaining,
          })
          .eq('id', payment.id);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('worker_payments')
          .insert([{
            worker_id: payment.worker_id,
            payment_week: payment.payment_week,
            weekly_amount: payment.weekly_amount,
            amount_paid: 0,
            amount_remaining: payment.weekly_amount,
            status: 'pending',
            created_by: user.id,
          }])
          .select()
          .single();

        if (error) throw error;
        payment.id = data.id;
      }
    } catch (error: any) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  };

  const handleRecordAdvance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayment) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('You must be authenticated');

      const advanceAmount = parseFloat(advanceFormData.advance_amount);

      if (advanceAmount > selectedPayment.amount_remaining) {
        throw new Error('Advance amount cannot exceed remaining balance');
      }

      // Create payment record if it doesn't exist
      if (!selectedPayment.id) {
        await createOrUpdatePaymentRecord(selectedPayment);
      }

      // Add advance
      const { error: advanceError } = await supabase.from('payment_advances').insert([
        {
          worker_payment_id: selectedPayment.id,
          worker_id: selectedPayment.worker_id,
          advance_amount: advanceAmount,
          advance_date: new Date().toISOString(),
          notes: advanceFormData.notes,
          created_by: user.id,
        },
      ]);

      if (advanceError) throw advanceError;

      // Update payment amounts
      const newAmountPaid = selectedPayment.amount_paid + advanceAmount;
      const newAmountRemaining = selectedPayment.amount_remaining - advanceAmount;

      const { error: updateError } = await supabase
        .from('worker_payments')
        .update({
          amount_paid: newAmountPaid,
          amount_remaining: newAmountRemaining,
          status: newAmountRemaining === 0 ? 'paid' : 'partial',
        })
        .eq('id', selectedPayment.id);

      if (updateError) throw updateError;

      setAdvanceFormData({
        advance_amount: '',
        notes: '',
      });
      setShowAdvanceForm(false);
      loadData();
    } catch (error: any) {
      console.error('Error recording advance:', error);
      alert(`Error: ${error?.message || 'Failed to record advance'}`);
    }
  };

  const handleMarkAsPaid = async (payment: WorkerPayment) => {
    if (payment.amount_remaining > 0) {
      alert('Cannot mark as paid. Worker still has pending balance.');
      return;
    }

    try {
      if (!payment.id) {
        await createOrUpdatePaymentRecord(payment);
      }

      const { error } = await supabase
        .from('worker_payments')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      console.error('Error marking as paid:', error);
      alert(`Error: ${error?.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
          </div>
          <p className="text-gray-400">Loading payment data...</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalAmountDue = payments.reduce((sum, p) => sum + p.weekly_amount, 0);
  const totalAdvancesGiven = payments.reduce((sum, p) => sum + p.amount_paid, 0);
  const totalRemaining = payments.reduce((sum, p) => sum + p.amount_remaining, 0);
  const paidWorkers = payments.filter(p => p.status === 'paid').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="section-title">Worker Payments</h1>
        <p className="text-gray-400">Weekly payment tracking • Rate: ₹{RATE_PER_SAREE}/saree</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="inline-block p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg mb-3">
            <Wallet size={24} />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Total Due</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            ₹{totalAmountDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="stat-card">
          <div className="inline-block p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg mb-3">
            <TrendingDown size={24} />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Advances Given</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            ₹{totalAdvancesGiven.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="stat-card">
          <div className="inline-block p-3 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg mb-3">
            <AlertCircle size={24} />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Remaining Due</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            ₹{totalRemaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="stat-card">
          <div className="inline-block p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg mb-3">
            <CheckCircle size={24} />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Fully Paid</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {paidWorkers}/{payments.length}
          </p>
        </div>
      </div>

      {/* Week Selector */}
      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl">
        <label className="text-white font-medium">Select Week:</label>
        <input
          type="date"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="input-field"
        />
        <button
          onClick={() => loadData()}
          className="btn-primary"
        >
          <RefreshCw size={20} />
          Refresh
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payments List */}
        <div className="lg:col-span-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">Weekly Earnings</h3>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="text-purple-400 mx-auto mb-3 opacity-50" />
              <p className="text-gray-400">No workers with production this week</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500/30">
              {payments.map((payment) => (
                <div
                  key={payment.worker_id}
                  onClick={() => {
                    setSelectedPayment(payment);
                    if (payment.id) loadAdvances(payment.id);
                  }}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedPayment?.worker_id === payment.worker_id
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-500 shadow-lg'
                      : 'bg-white/5 border border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-white text-lg">{payment.worker?.name}</p>
                      <p className="text-sm text-gray-400">{payment.sarees_produced} sarees × ₹{RATE_PER_SAREE}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      payment.status === 'paid'
                        ? 'bg-green-500/20 text-green-300'
                        : payment.status === 'partial'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {payment.status === 'paid' ? '✓ Paid' : payment.status === 'partial' ? '◐ Partial' : '◯ Pending'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-white/5 p-2 rounded">
                      <p className="text-gray-400 mb-1">Total Due</p>
                      <p className="font-bold text-green-400">₹{payment.weekly_amount.toFixed(0)}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded">
                      <p className="text-gray-400 mb-1">Advanced</p>
                      <p className="font-bold text-blue-400">₹{payment.amount_paid.toFixed(0)}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded">
                      <p className="text-gray-400 mb-1">Remaining</p>
                      <p className={`font-bold ${payment.amount_remaining > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                        ₹{payment.amount_remaining.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advances Detail */}
        {selectedPayment ? (
          <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-purple-500/30 p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedPayment.worker?.name}</h3>
                <p className="text-sm text-gray-300">Advance Tracking</p>
              </div>
              <button
                onClick={() => setShowAdvanceForm(true)}
                className="btn-primary text-sm"
              >
                <Send size={16} />
                Add Advance
              </button>
            </div>

            {/* Summary Box */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Sarees Produced:</span>
                <span className="text-xl font-bold text-green-400">{selectedPayment.sarees_produced}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Amount Due:</span>
                <span className="text-xl font-bold text-blue-400">₹{selectedPayment.weekly_amount.toFixed(0)}</span>
              </div>
              <div className="h-px bg-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-semibold">Remaining:</span>
                <span className={`text-2xl font-bold ${selectedPayment.amount_remaining > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                  ₹{selectedPayment.amount_remaining.toFixed(0)}
                </span>
              </div>
            </div>

            {selectedPayment.amount_remaining === 0 && selectedPayment.status !== 'paid' && (
              <button
                onClick={() => handleMarkAsPaid(selectedPayment)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-semibold mb-4"
              >
                ✓ Mark as Fully Paid
              </button>
            )}

            {/* Advances List */}
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Clock size={18} />
                Advances Given
              </h4>
              {advances.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No advances recorded</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {advances.map((advance) => (
                    <div key={advance.id} className="bg-white/10 border border-white/10 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-green-400">₹{advance.advance_amount.toFixed(0)}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(advance.advance_date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      {advance.notes && (
                        <p className="text-xs text-gray-300 italic">{advance.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-xl flex items-center justify-center h-full">
            <div className="text-center">
              <Wallet size={48} className="text-gray-400 mx-auto mb-3 opacity-30" />
              <p className="text-gray-400">Select a worker to view advances</p>
            </div>
          </div>
        )}
      </div>

      {/* Advance Form Modal */}
      {showAdvanceForm && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-purple-900 border border-white/20 p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Record Advance</h3>
              <button onClick={() => setShowAdvanceForm(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleRecordAdvance} className="space-y-4">
              <div className="bg-white/10 border border-white/20 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-300">Worker: <span className="text-white font-semibold">{selectedPayment.worker?.name}</span></p>
                <p className="text-sm text-gray-300">Production: <span className="text-green-400 font-semibold">{selectedPayment.sarees_produced} sarees</span></p>
                <p className="text-sm text-gray-300">Balance: <span className="text-orange-400 font-semibold">₹{selectedPayment.amount_remaining.toFixed(0)}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Advance Amount (₹)</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={advanceFormData.advance_amount}
                  onChange={(e) => setAdvanceFormData({ ...advanceFormData, advance_amount: e.target.value })}
                  className="input-field"
                  placeholder="0"
                  max={selectedPayment.amount_remaining}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Reason (Optional)</label>
                <input
                  type="text"
                  value={advanceFormData.notes}
                  onChange={(e) => setAdvanceFormData({ ...advanceFormData, notes: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Emergency, Medical, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Record Advance
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvanceForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
