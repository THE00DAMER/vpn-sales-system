/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, ShoppingCart, CreditCard, ShieldCheck, 
  Gift, Ticket, MessageSquare, Bot, Settings, Key, Archive, 
  Activity, Smartphone, LogOut, ChevronRight, Menu, X, Terminal,
  Download, BookOpen
} from 'lucide-react';
import TelegramSimulator from './TelegramSimulator';

import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import PaymentsPage from './pages/PaymentsPage';
import ServicesPage from './pages/ServicesPage';
import TrialsPage from './pages/TrialsPage';
import TicketsPage from './pages/TicketsPage';
import BroadcastPage from './pages/BroadcastPage';
import SettingsPage from './pages/SettingsPage';
import BotSettingsPage from './pages/BotSettingsPage';
import AdminsPage from './pages/AdminsPage';
import BackupPage from './pages/BackupPage';
import HealthcheckPage from './pages/HealthcheckPage';
import SoftwarePage from './pages/SoftwarePage';
import TutorialsPage from './pages/TutorialsPage';

interface AdminUser {
  username: string;
  display_name: string;
  role: string;
}

export default function AdminLayout() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Routing navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'orders' | 'payments' | 'services' | 'trials' | 'tickets' | 'broadcast' | 'settings' | 'bot_settings' | 'admins' | 'backups' | 'health' | 'software' | 'tutorials'>('dashboard');
  
  // Sidebar state (mobile/desktop responsive)
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Phone Simulator state
  const [simOpen, setSimOpen] = useState(true);

  // Trigger reloads on other pages when simulated user changes database state
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.admin);
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError('Connection error to full-stack server backend.');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const triggerDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Secure Authentication Lock Gate
  if (!user) {
    return (
      <div className="w-screen h-screen bg-[#09090b] flex justify-center items-center p-4 text-neutral-200">
        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl shadow-black/80 space-y-5 text-xs">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-black mx-auto font-extrabold text-xl">
              N
            </div>
            <h2 className="text-lg font-bold text-white font-sans">Atlas Admin Login</h2>
            <p className="text-neutral-400 font-sans">Enter billing details to audit VLESS subscription routes.</p>
          </div>

          {authError && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-center font-semibold">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Staff Username</label>
              <input
                type="text" required value={usernameInput} onChange={e => setUsernameInput(e.target.value)}
                placeholder="admin"
                className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 font-medium placeholder-neutral-700"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Security Password</label>
              <input
                type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 font-medium placeholder-neutral-700"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg transition-colors shadow-lg shadow-emerald-500/10"
            >
              Authenticate Staff
            </button>
          </form>

          <div className="text-[10px] text-neutral-500 text-center border-t border-neutral-800 pt-4 flex justify-between px-1.5 font-mono">
            <span>Role: superadmin</span>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders & Sales', icon: ShoppingCart },
    { id: 'payments', label: 'Payment Receipts', icon: CreditCard },
    { id: 'services', label: 'VPN Services', icon: ShieldCheck },
    { id: 'trials', label: 'Trial Configs', icon: Gift },
    { id: 'tickets', label: 'Support Chat', icon: Ticket },
    { id: 'broadcast', label: 'Bulk Broadcast', icon: MessageSquare },
    { id: 'software', label: 'Software Downloads', icon: Download },
    { id: 'tutorials', label: 'Support Tutorials', icon: BookOpen },
    { id: 'bot_settings', label: 'Bot Config', icon: Bot },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'admins', label: 'Team Directory', icon: Key },
    { id: 'backups', label: 'Database Backup', icon: Archive },
    { id: 'health', label: 'Health Diagnostics', icon: Activity },
  ] as const;

  return (
    <div className="w-screen h-screen flex bg-[#09090b] text-neutral-200 overflow-hidden font-sans">
      {/* Sidebar Panel */}
      <div className={`bg-[#09090b] text-neutral-300 h-full flex flex-col justify-between shrink-0 transition-all duration-300 border-r border-neutral-800 ${
        sidebarOpen ? 'w-56' : 'w-16'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-extrabold text-sm shrink-0">
              N
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-sm tracking-tight text-white font-mono uppercase">
                Nexus.OS
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white hidden md:block"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition duration-150 ${
                  isActive 
                    ? 'bg-neutral-800/60 text-emerald-400 shadow-sm border border-neutral-700/30' 
                    : 'hover:bg-neutral-900/40 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] text-slate-200 font-bold shrink-0">
              S
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-white truncate leading-none">{user.display_name}</p>
                <span className="text-[9px] text-neutral-500 font-mono capitalize">{user.role}</span>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout} 
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition"
            title="Log Out Staff"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#09090b] relative">
        {/* Top Header Controls */}
        <div className="bg-neutral-950 border-b border-neutral-800 h-14 flex items-center justify-between px-6 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white capitalize font-mono">
              Role: Admin Panel / {activeTab.replace('_', ' ')}
            </h2>
          </div>

          {/* Phone Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSimOpen(!simOpen)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                simOpen 
                  ? 'bg-neutral-800 border-neutral-700 text-emerald-400 hover:bg-neutral-700' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Smartphone className="w-4 h-4" /> 
              {simOpen ? 'Hide Telegram Simulator' : 'Show Telegram Simulator'}
            </button>
          </div>
        </div>

        {/* Dynamic Inner Router Views */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'dashboard' && <DashboardPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'customers' && <CustomersPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'orders' && <OrdersPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'payments' && <PaymentsPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'services' && <ServicesPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'trials' && <TrialsPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'tickets' && <TicketsPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'broadcast' && <BroadcastPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'settings' && <SettingsPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'bot_settings' && <BotSettingsPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'admins' && <AdminsPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'backups' && <BackupPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'health' && <HealthcheckPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'software' && <SoftwarePage />}
          {activeTab === 'tutorials' && <TutorialsPage />}
        </div>
      </div>

      {/* Slide-out Telegram Simulator Smartphone (Right Pinned) */}
      {simOpen && (
        <TelegramSimulator onActivityTriggered={triggerDataRefresh} />
      )}
    </div>
  );
}
