import { useState } from 'react';
import { LogOut, Menu, X, LayoutDashboard, Users, Factory, TrendingUp, Package, CreditCard, BarChart3, Sparkles } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Workers } from './components/Workers';
import { Production } from './components/Production';
import { Sales } from './components/Sales';
import Materials from './components/Materials';
import { Payments } from './components/Payments';
import { Reports } from './components/Reports';

export default function App() {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentView} />;
      case 'workers': return <Workers />;
      case 'production': return <Production />;
      case 'sales': return <Sales />;
      case 'materials': return <Materials />;
      case 'payments': return <Payments />;
      case 'reports': return <Reports />;
      default: return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'workers', label: 'Workers', icon: Users },
    { key: 'production', label: 'Production', icon: Factory },
    { key: 'sales', label: 'Sales', icon: TrendingUp },
    { key: 'materials', label: 'Materials', icon: Package },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-4">
            <Sparkles className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
          <p className="text-gray-300 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Sidebar */}
      <aside className={`fixed md:static top-0 left-0 h-screen bg-gradient-to-b from-slate-900/50 to-purple-900/50 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-rose-500 rounded-xl flex items-center justify-center">
                <Sparkles className="text-white" size={24} />
              </div>
              {sidebarOpen && <div>
                <p className="text-white font-bold text-lg">SA SILKS</p>
                <p className="text-purple-300 text-xs">Business Suite</p>
              </div>}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setCurrentView(item.key);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${isActive
                    ? 'bg-gradient-to-r from-purple-600/30 to-rose-600/30 text-purple-200 border-l-2 border-purple-500 shadow-lg'
                    : 'text-gray-300 hover:bg-white/5'
                    }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-all duration-300"
            >
              <LogOut size={20} />
              {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-900/50 via-purple-900/50 to-slate-900/50 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 md:hidden"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-rose-200 bg-clip-text text-transparent">
                  Welcome Back
                </h2>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}