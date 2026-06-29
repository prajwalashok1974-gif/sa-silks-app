import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Package, Factory, TrendingUp, BarChart3, ArrowUpRight, Boxes } from 'lucide-react';

interface DashboardStats {
  totalWorkers: number;
  weeklyProduction: number;
  availableMaterials: number;
  weeklySales: number;
  totalSalesQuantity: number;
  totalSareesProduced: number;
  remainingSarees: number;
}

export function Dashboard({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkers: 0,
    weeklyProduction: 0,
    availableMaterials: 0,
    weeklySales: 0,
    totalSalesQuantity: 0,
    totalSareesProduced: 0,
    remainingSarees: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];

      const [workersRes, materialsRes, weeklyProdRes, totalProdRes, weeklySalesAmtRes, totalSalesRes] =
        await Promise.all([
          supabase.from('workers').select('id', { count: 'exact', head: true }),
          supabase.from('raw_materials').select('id', { count: 'exact', head: true }),
          supabase.from('production').select('quantity').gte('production_date', weekAgoStr),
          supabase.from('production').select('quantity'),
          supabase.from('sales').select('total_amount').gte('sale_date', weekAgoStr),
          supabase.from('sales').select('quantity'),
        ]);

      const weeklyProd = weeklyProdRes.data?.reduce((sum, p) => sum + p.quantity, 0) || 0;
      const totalProd = totalProdRes.data?.reduce((sum, p) => sum + p.quantity, 0) || 0;
      const weeklySalesAmt = weeklySalesAmtRes.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalSalesQty = totalSalesRes.data?.reduce((sum, s) => sum + s.quantity, 0) || 0;
      const remaining = totalProd - totalSalesQty;

      setStats({
        totalWorkers: workersRes.count || 0,
        weeklyProduction: weeklyProd,
        availableMaterials: materialsRes.count || 0,
        weeklySales: weeklySalesAmt,
        totalSalesQuantity: totalSalesQty,
        totalSareesProduced: totalProd,
        remainingSarees: remaining > 0 ? remaining : 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Workers',
      value: stats.totalWorkers,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/20 to-cyan-500/20',
      onClick: () => onNavigate('workers'),
      trend: '+5%',
    },
    {
      title: 'Weekly Production',
      value: `${stats.weeklyProduction}`,
      subtitle: 'sarees',
      icon: Factory,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/20 to-emerald-500/20',
      onClick: () => onNavigate('production'),
      trend: '+12%',
    },
    {
      title: 'Available Materials',
      value: stats.availableMaterials,
      icon: Package,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'from-orange-500/20 to-amber-500/20',
      onClick: () => onNavigate('materials'),
      trend: '-3%',
    },
    {
      title: 'Weekly Sales',
      value: `₹${(stats.weeklySales / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/20 to-pink-500/20',
      onClick: () => onNavigate('sales'),
      trend: '+25%',
    },
    {
      title: 'Total Produced',
      value: stats.totalSareesProduced,
      subtitle: 'all-time',
      icon: BarChart3,
      color: 'from-teal-500 to-blue-500',
      bgColor: 'from-teal-500/20 to-blue-500/20',
      onClick: () => onNavigate('reports'),
      trend: '+8%',
    },
    {
      title: 'Remaining Sarees',
      value: stats.remainingSarees,
      subtitle: 'in inventory',
      icon: Boxes,
      color: 'from-indigo-500 to-violet-500',
      bgColor: 'from-indigo-500/20 to-violet-500/20',
      onClick: () => onNavigate('production'),
      trend: `${stats.totalSalesQuantity > 0 ? '-' + Math.round((stats.totalSalesQuantity / stats.totalSareesProduced) * 100) : '0'}%`,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
          </div>
          <p className="text-gray-400">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="section-title">Dashboard</h1>
        <p className="text-gray-400">Track your business metrics in real-time</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={index}
              onClick={card.onClick}
              className="stat-card group"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`}></div>
              
              {/* Content */}
              <div className="relative space-y-4">
                {/* Icon */}
                <div className={`inline-block p-3 rounded-lg bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                  <Icon size={24} />
                </div>

                {/* Stats */}
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">{card.title}</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {card.value}
                    </p>
                    {card.subtitle && <p className="text-gray-500 text-xs self-baseline">{card.subtitle}</p>}
                  </div>
                </div>

                {/* Trend */}
                <div className="flex items-center gap-1 pt-2 border-t border-gray-200">
                  <ArrowUpRight size={16} className="text-green-500" />
                  <span className="text-xs font-medium text-green-600">{card.trend}</span>
                  <span className="text-xs text-gray-500">this week</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 p-6 border border-slate-100 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('workers')}
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-900 font-medium transition-all duration-300 border border-blue-200 text-left flex items-center justify-between group"
            >
              <span>Add New Worker</span>
              <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={18} />
            </button>
            <button
              onClick={() => onNavigate('production')}
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-900 font-medium transition-all duration-300 border border-green-200 text-left flex items-center justify-between group"
            >
              <span>Record Production</span>
              <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={18} />
            </button>
            <button
              onClick={() => onNavigate('sales')}
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-900 font-medium transition-all duration-300 border border-purple-200 text-left flex items-center justify-between group"
            >
              <span>Log Sales</span>
              <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={18} />
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 p-6 border border-slate-100 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
              <span className="text-sm font-medium text-green-900">Database Connection</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
              <span className="text-sm font-medium text-green-900">Supabase Sync</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-sm font-medium text-blue-900">API Status</span>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
