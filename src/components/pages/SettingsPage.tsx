/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, DollarSign, Clock, ShieldAlert, Plus, Trash2, Tag, Percent } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
  details: string;
}

interface Plan {
  id: number;
  name_en: string;
  name_fa: string;
  price_irr: number;
  price_usd: number;
  duration_months: number;
  traffic_limit_gb: number;
  active: boolean;
}

interface DiscountCode {
  id: number;
  code: string;
  discount_percent: number;
  active: boolean;
  expires_at: string;
}

export default function SettingsPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('IRR');
  const [timezone, setTimezone] = useState('Asia/Tehran');
  const [maintenanceGlobal, setMaintenanceGlobal] = useState(false);
  const [maintenanceMsgEn, setMaintenanceMsgEn] = useState('');
  const [maintenanceMsgFa, setMaintenanceMsgFa] = useState('');
  
  // Payment accounts
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  
  // Custom plans & discounts
  const [plans, setPlans] = useState<Plan[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setBusinessName(data.business_name);
      setCurrency(data.currency);
      setTimezone(data.timezone);
      setMaintenanceGlobal(data.maintenance_mode.bot_global);
      setMaintenanceMsgEn(data.maintenance_mode.message_en);
      setMaintenanceMsgFa(data.maintenance_mode.message_fa);
      setMethods(data.payment_methods);
      setPlans(data.plans || []);
      setDiscountCodes(data.discount_codes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [refreshTrigger]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          currency,
          timezone,
          maintenance_mode: {
            bot_global: maintenanceGlobal,
            message_en: maintenanceMsgEn,
            message_fa: maintenanceMsgFa
          },
          payment_methods: methods,
          plans,
          discount_codes: discountCodes
        })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateMethodDetails = (id: string, details: string) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, details } : m));
  };

  const toggleMethodActive = (id: string) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  // Plan actions
  const addPlan = () => {
    const newId = plans.length > 0 ? Math.max(...plans.map(p => p.id)) + 1 : 1;
    setPlans(prev => [
      ...prev,
      {
        id: newId,
        name_en: 'New Subscription Plan',
        name_fa: 'پلن جدید',
        price_irr: 1500000,
        price_usd: 3,
        duration_months: 1,
        traffic_limit_gb: 50,
        active: true
      }
    ]);
  };

  const deletePlan = (id: number) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const updatePlanField = (id: number, field: keyof Plan, value: any) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Discount actions
  const addDiscountCode = () => {
    const newId = discountCodes.length > 0 ? Math.max(...discountCodes.map(d => d.id)) + 1 : 1;
    setDiscountCodes(prev => [
      ...prev,
      {
        id: newId,
        code: 'NEWCODE',
        discount_percent: 15,
        active: true,
        expires_at: '2028-12-31'
      }
    ]);
  };

  const deleteDiscountCode = (id: number) => {
    setDiscountCodes(prev => prev.filter(d => d.id !== id));
  };

  const updateDiscountCodeField = (id: number, field: keyof DiscountCode, value: any) => {
    setDiscountCodes(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading general settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">General Settings</h1>
          <p className="text-sm text-neutral-400">Modify brand metadata, maintenance statuses, active currencies, custom plans, and discount promo codes.</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xl">
          <CheckCircle2 className="w-4 h-4" /> System settings, plans, discounts, and payment methods updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Brand Card */}
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
              <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-emerald-400" /> Business Identity settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-300">Company / Brand Name</label>
                  <input
                    type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium text-neutral-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-300 flex items-center gap-0.5">
                    <DollarSign className="w-3.5 h-3.5" /> Billing Currency
                  </label>
                  <input
                    type="text" value={currency} onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-neutral-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-300 flex items-center gap-0.5">
                    <Clock className="w-3.5 h-3.5" /> Default Timezone
                  </label>
                  <input
                    type="text" value={timezone} onChange={e => setTimezone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-neutral-200"
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods Card */}
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
              <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Payment Account Details
              </h3>

              <div className="space-y-4">
                {methods.map((m) => (
                  <div key={m.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox" id={`act_${m.id}`} checked={m.active} onChange={() => toggleMethodActive(m.id)}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-neutral-900 border-neutral-800 cursor-pointer"
                        />
                        <label htmlFor={`act_${m.id}`} className="font-bold text-white uppercase text-xs cursor-pointer select-none">
                          {m.name} ({m.id})
                        </label>
                      </div>
                      <textarea
                        value={m.details} onChange={e => updateMethodDetails(m.id, e.target.value)}
                        placeholder="Enter account credentials (e.g. Card, Shaba or Crypto addresses)"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-emerald-500 h-16 leading-relaxed placeholder-neutral-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Form Column - Maintenance */}
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
              <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Safe Mode & Maintenance
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox" checked={maintenanceGlobal} onChange={e => setMaintenanceGlobal(e.target.checked)}
                    id="mainGlob" className="w-4 h-4 text-amber-500 bg-neutral-950 border-neutral-800 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="mainGlob" className="font-semibold text-neutral-300 cursor-pointer select-none">
                    Enable Bot Global Maintenance Mode
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-300">Maintenance Warning (English 🇺🇸)</label>
                  <textarea
                    value={maintenanceMsgEn} onChange={e => setMaintenanceMsgEn(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 h-16"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-300">Maintenance Warning (Farsi 🇮🇷)</label>
                  <textarea
                    value={maintenanceMsgFa} onChange={e => setMaintenanceMsgFa(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 h-16 text-right"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2.5 px-6 rounded-lg shadow-xl flex items-center gap-1.5 transition text-xs w-full justify-center cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Plans and Discount Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plans/Packages Management */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-emerald-400" /> Subscription Plans & Price Settings
              </h3>
              <button
                type="button"
                onClick={addPlan}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Custom Plan
              </button>
            </div>

            {plans.length === 0 ? (
              <p className="text-neutral-500 text-center py-6">No subscription plans configured. Click above to add one.</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {plans.map((p) => (
                  <div key={p.id} className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => deletePlan(p.id)}
                      className="absolute top-2.5 right-2.5 text-neutral-500 hover:text-red-400 transition"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Plan Name (English)</label>
                        <input
                          type="text"
                          value={p.name_en}
                          onChange={(e) => updatePlanField(p.id, 'name_en', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">نام پلن (فارسی)</label>
                        <input
                          type="text"
                          value={p.name_fa}
                          onChange={(e) => updatePlanField(p.id, 'name_fa', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-right"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Price (Rials/Tomans)</label>
                        <input
                          type="number"
                          value={p.price_irr}
                          onChange={(e) => updatePlanField(p.id, 'price_irr', parseInt(e.target.value) || 0)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Price (USD)</label>
                        <input
                          type="number"
                          value={p.price_usd}
                          onChange={(e) => updatePlanField(p.id, 'price_usd', parseFloat(e.target.value) || 0)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Duration (Months)</label>
                        <input
                          type="number"
                          value={p.duration_months}
                          onChange={(e) => updatePlanField(p.id, 'duration_months', parseInt(e.target.value) || 1)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Limit (GB)</label>
                        <input
                          type="number"
                          value={p.traffic_limit_gb}
                          onChange={(e) => updatePlanField(p.id, 'traffic_limit_gb', parseInt(e.target.value) || 50)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`plan_act_${p.id}`}
                        checked={p.active}
                        onChange={(e) => updatePlanField(p.id, 'active', e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-emerald-500 bg-neutral-900 border-neutral-800 cursor-pointer"
                      />
                      <label htmlFor={`plan_act_${p.id}`} className="text-neutral-300 font-semibold cursor-pointer select-none">
                        Active & Available in Telegram Bot
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount Promo Codes Management */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-400" /> Discount Codes & Coupons
              </h3>
              <button
                type="button"
                onClick={addDiscountCode}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Coupon
              </button>
            </div>

            {discountCodes.length === 0 ? (
              <p className="text-neutral-500 text-center py-6">No active discount codes configured. Click above to add one.</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {discountCodes.map((d) => (
                  <div key={d.id} className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => deleteDiscountCode(d.id)}
                      className="absolute top-2.5 right-2.5 text-neutral-500 hover:text-red-400 transition"
                      title="Delete Code"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Coupon Code</label>
                        <input
                          type="text"
                          value={d.code}
                          onChange={(e) => updateDiscountCodeField(d.id, 'code', e.target.value.toUpperCase())}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 font-bold tracking-wider"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-neutral-400 font-medium flex items-center gap-0.5">
                          <Percent className="w-3 h-3 text-emerald-400" /> Discount %
                        </label>
                        <input
                          type="number"
                          value={d.discount_percent}
                          onChange={(e) => updateDiscountCodeField(d.id, 'discount_percent', parseInt(e.target.value) || 0)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-neutral-400 font-medium">Expires At</label>
                        <input
                          type="text"
                          value={d.expires_at}
                          onChange={(e) => updateDiscountCodeField(d.id, 'expires_at', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`disc_act_${d.id}`}
                        checked={d.active}
                        onChange={(e) => updateDiscountCodeField(d.id, 'active', e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-emerald-500 bg-neutral-900 border-neutral-800 cursor-pointer"
                      />
                      <label htmlFor={`disc_act_${d.id}`} className="text-neutral-300 font-semibold cursor-pointer select-none">
                        Active & Enable for Customers
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
