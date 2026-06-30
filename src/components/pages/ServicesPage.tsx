/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Clipboard, RefreshCw, Server, Settings, Calendar, AlertTriangle, Trash2, Edit2, Plus, Send, User, PlusCircle, Check } from 'lucide-react';
import { Service } from '../../types';

interface ServiceWithCustomer extends Service {
  customer_name?: string;
  customer_username?: string;
}

export default function ServicesPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [services, setServices] = useState<ServiceWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedIds, setRevealedIds] = useState<{ [key: number]: boolean }>({});
  const [decryptedLinks, setDecryptedLinks] = useState<{ [key: number]: string }>({});
  const [successMsg, setSuccessMsg] = useState<{ [key: number]: string }>({});

  // Customer options list
  const [customers, setCustomers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Manual Creation Form states
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newServiceName, setNewServiceName] = useState('VIP High-Speed VLESS');
  const [newProtocol, setNewProtocol] = useState('VLESS');
  const [newLocation, setNewLocation] = useState('Germany - Munich');
  const [newPlan, setNewPlan] = useState('pro_monthly');
  const [newTrafficLimit, setNewTrafficLimit] = useState('100 GB');
  const [newEndDate, setNewEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [newSubLink, setNewSubLink] = useState('');
  const [newAdminNotes, setNewAdminNotes] = useState('');

  // Editing states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editProtocol, setEditProtocol] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [editTrafficLimit, setEditTrafficLimit] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'expired' | 'suspended'>('active');
  const [editSubLink, setEditSubLink] = useState('');

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCustomers();
  }, [refreshTrigger]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId) {
      alert("Please select a customer user!");
      return;
    }
    if (!newSubLink.trim()) {
      alert("Please enter a VLESS Subscription/Config link!");
      return;
    }

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: newCustomerId,
          service_name: newServiceName,
          location: newLocation,
          plan: newPlan,
          protocol: newProtocol,
          traffic_limit: newTrafficLimit,
          end_date: newEndDate,
          sub_link: newSubLink,
          admin_notes: newAdminNotes
        })
      });

      if (res.ok) {
        setShowAddForm(false);
        setNewCustomerId('');
        setNewServiceName('VIP High-Speed VLESS');
        setNewProtocol('VLESS');
        setNewLocation('Germany - Munich');
        setNewPlan('pro_monthly');
        setNewTrafficLimit('100 GB');
        const d = new Date();
        d.setDate(d.getDate() + 30);
        setNewEndDate(d.toISOString().split('T')[0]);
        setNewSubLink('');
        setNewAdminNotes('');
        fetchServices();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to create VPN service.");
      }
    } catch (err) {
      console.error(err);
      alert("Error registering manual VPN service.");
    }
  };

  const handleSendToBot = async (serviceId: number, customerId: number, linkText: string) => {
    if (!linkText.trim()) {
      alert("Please enter a valid link first!");
      return;
    }
    try {
      const res = await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          text: `🔑 *Your New Subscription Link is Ready!*\n\n📍 Server Location: ${services.find(s => s.id === serviceId)?.location || 'VIP Server'}\n\n🔗 Config Link:\n\`${linkText}\`\n\n_Copy and paste this link in your V2Ray/NekoBox client!_`
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(prev => ({ ...prev, [serviceId]: "Dispatched to Bot!" }));
        setTimeout(() => {
          setSuccessMsg(prev => ({ ...prev, [serviceId]: "" }));
        }, 3000);
      } else {
        alert(data.error || "Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending message.");
    }
  };

  const handleReveal = async (id: number, encryptedLink: string) => {
    if (revealedIds[id]) {
      // Toggle off
      setRevealedIds(prev => ({ ...prev, [id]: false }));
      return;
    }

    try {
      // API decrypt call to match PHP encryption.php
      const res = await fetch('/api/services/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: encryptedLink })
      });
      const data = await res.json();
      setDecryptedLinks(prev => ({ ...prev, [id]: data.decrypted }));
      setRevealedIds(prev => ({ ...prev, [id]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("VLESS Subscription Link copied to clipboard!");
  };

  const startEdit = async (s: ServiceWithCustomer) => {
    setEditingId(s.id);
    setEditServiceName(s.service_name || '');
    setEditProtocol(s.protocol || '');
    setEditLocation(s.location || '');
    setEditPlan(s.plan || '');
    setEditTrafficLimit(s.traffic_limit || '');
    setEditStartDate(s.start_date || '');
    setEditEndDate(s.end_date || '');
    setEditStatus(s.status || 'active');

    try {
      const res = await fetch('/api/services/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: s.subscription_link_encrypted })
      });
      const data = await res.json();
      setEditSubLink(data.decrypted || '');
    } catch (err) {
      console.error(err);
      setEditSubLink('');
    }
  };

  const handleUpdateService = async (id: number) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: editServiceName,
          protocol: editProtocol,
          location: editLocation,
          plan: editPlan,
          traffic_limit: editTrafficLimit,
          start_date: editStartDate,
          end_date: editEndDate,
          status: editStatus,
          sub_link: editSubLink
        })
      });
      if (res.ok) {
        setEditingId(null);
        fetchServices();
      } else {
        alert("Failed to update service.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating service.");
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm("Are you sure you want to delete this VPN Service configuration? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchServices();
      } else {
        alert("Failed to delete service.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting service.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
            <Server className="w-6 h-6 text-emerald-400" /> Provisioned VPN Services
          </h1>
          <p className="text-sm text-neutral-400 font-sans">View and override active server routes, check client connection logs, and reveal secure subscription configs.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold py-2 px-3 rounded-lg flex items-center gap-1.5 transition shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {showAddForm ? 'Close Service Form' : 'Provision Manual Service'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateService} className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
          <div className="pb-2 border-b border-neutral-800">
            <h3 className="font-bold text-sm text-emerald-400 font-sans">Provision New VPN Service Manually</h3>
            <p className="text-[11px] text-neutral-400">Link a custom server route to any existing customer and automatically register their subscriptions.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer select */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Link to Customer *</label>
              <select
                value={newCustomerId}
                onChange={e => setNewCustomerId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-xs"
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name || ''} {c.username ? `(@${c.username})` : ''} (ID: #{c.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Service Name */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Service Name *</label>
              <input
                type="text"
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
                placeholder="e.g. VIP High-Speed VLESS"
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-xs"
                required
              />
            </div>

            {/* Server Node/Location */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Server Node / Location *</label>
              <input
                type="text"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                placeholder="e.g. Germany - Frankfurt"
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-xs"
                required
              />
            </div>

            {/* Protocol */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Protocol *</label>
              <select
                value={newProtocol}
                onChange={e => setNewProtocol(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-xs"
              >
                <option value="VLESS">VLESS</option>
                <option value="VMess">VMess</option>
                <option value="Trojan">Trojan</option>
                <option value="ShadowSocks">ShadowSocks</option>
              </select>
            </div>

            {/* Plan Tier */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Plan Tier</label>
              <select
                value={newPlan}
                onChange={e => setNewPlan(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-xs"
              >
                <option value="pro_monthly">Pro Monthly</option>
                <option value="pro_quarterly">Pro Quarterly</option>
                <option value="pro_yearly">Pro Yearly</option>
                <option value="trial_24h">24 Hour Trial</option>
              </select>
            </div>

            {/* Traffic Limit */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Traffic Bandwidth Limit</label>
              <input
                type="text"
                value={newTrafficLimit}
                onChange={e => setNewTrafficLimit(e.target.value)}
                placeholder="e.g. 100 GB, 500 GB, Unlimited"
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            {/* Expiration Date */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Expiration Date *</label>
              <input
                type="date"
                value={newEndDate}
                onChange={e => setNewEndDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-xs"
                required
              />
            </div>

            {/* Private Notes */}
            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-neutral-300">Private Admin Notes</label>
              <input
                type="text"
                value={newAdminNotes}
                onChange={e => setNewAdminNotes(e.target.value)}
                placeholder="Internal details (e.g. manual payment verified by phone)"
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          {/* VLESS / Subscription Link */}
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">VLESS / VMess / Trojan Config & Subscription Link *</label>
            <textarea
              value={newSubLink}
              onChange={e => setNewSubLink(e.target.value)}
              placeholder="Paste vless://... or vmess://... or shadow-socks custom configurations"
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded p-2.5 focus:outline-none focus:border-emerald-500 font-mono text-[11px] h-20"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
              }}
              className="px-3 py-1.5 border border-neutral-800 text-neutral-300 rounded text-xs hover:bg-neutral-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-500 text-black rounded text-xs hover:bg-emerald-400 font-extrabold transition flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Provision Config
            </button>
          </div>
        </form>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-950/40 border-b border-neutral-800 text-neutral-500">
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Service Details</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Customer Account</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Server Node & Traffic</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Expiration & Calendar</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Decrypted VLESS Link</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500 font-mono">Loading subscriptions...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500 font-mono">No active VPN services found.</td>
                </tr>
              ) : (
                services.map(s => {
                  const isRevealed = revealedIds[s.id];
                  const isEditing = editingId === s.id;
                  return (
                    <tr key={s.id} className="hover:bg-neutral-800/20">
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1 w-32">
                            <input
                              type="text" value={editServiceName} onChange={e => setEditServiceName(e.target.value)}
                              placeholder="Service Name"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                            />
                            <input
                              type="text" value={editProtocol} onChange={e => setEditProtocol(e.target.value)}
                              placeholder="Protocol (e.g. VLESS)"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-mono text-[10px]"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <Server className="w-3.5 h-3.5 text-emerald-400" />
                              {s.service_name}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">ID: #{s.id} | Protocol: {s.protocol}</div>
                          </>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{s.customer_name}</div>
                        {s.customer_username && (
                          <div className="text-[10px] text-emerald-400">@{s.customer_username}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1 w-32">
                            <input
                              type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)}
                              placeholder="Location"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                            />
                            <input
                              type="text" value={editTrafficLimit} onChange={e => setEditTrafficLimit(e.target.value)}
                              placeholder="Traffic Limit"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-medium text-neutral-200">{s.location}</div>
                            <div className="text-[10px] text-neutral-500">Bandwidth Cap: {s.traffic_limit}</div>
                          </>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1 w-32">
                            <input
                              type="text" value={editStartDate} onChange={e => setEditStartDate(e.target.value)}
                              placeholder="Start Date"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                            />
                            <input
                              type="text" value={editEndDate} onChange={e => setEditEndDate(e.target.value)}
                              placeholder="End Date"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-neutral-400">
                              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Expires: {s.end_date}</span>
                            </div>
                            <div className="text-[10px] text-emerald-400 font-semibold font-mono">Started: {s.start_date}</div>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <textarea
                            value={editSubLink} onChange={e => setEditSubLink(e.target.value)}
                            placeholder="VLESS subscription/config link"
                            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded p-1.5 text-xs focus:outline-none focus:border-emerald-500 h-16 min-w-[160px] font-mono text-[10px]"
                          />
                        ) : (
                          <div className="flex flex-col gap-1.5 max-w-xs">
                            {isRevealed ? (
                              <div className="space-y-1 w-full">
                                <div className="flex gap-1.5 items-center w-full">
                                  <input
                                    type="text"
                                    value={decryptedLinks[s.id] || ''}
                                    onChange={e => setDecryptedLinks(prev => ({ ...prev, [s.id]: e.target.value }))}
                                    className="bg-neutral-950 text-emerald-400 font-mono text-[10px] px-2 py-1 rounded w-full border border-neutral-800 focus:outline-none focus:border-emerald-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(decryptedLinks[s.id])}
                                    className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
                                    title="Copy Link"
                                  >
                                    <Clipboard className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReveal(s.id, s.subscription_link_encrypted)}
                                    className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
                                    title="Hide Link"
                                  >
                                    <EyeOff className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex justify-between items-center">
                                  <button
                                    type="button"
                                    onClick={() => handleSendToBot(s.id, s.customer_id, decryptedLinks[s.id] || '')}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-2 py-0.5 rounded text-[9px] flex items-center gap-1 transition shadow cursor-pointer uppercase"
                                  >
                                    🚀 Send to Bot
                                  </button>
                                  {successMsg[s.id] && (
                                    <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">{successMsg[s.id]}</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleReveal(s.id, s.subscription_link_encrypted)}
                                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition self-start"
                              >
                                <Eye className="w-3.5 h-3.5" /> Reveal Config
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            value={editStatus} onChange={e => setEditStatus(e.target.value as 'active' | 'expired' | 'suspended')}
                            className="bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-semibold w-24"
                          >
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                            s.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {s.status}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleUpdateService(s.id)}
                                className="bg-emerald-500 text-black px-2 py-1 rounded hover:bg-emerald-400 font-extrabold transition text-[10px] cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="border border-neutral-800 text-neutral-300 px-2 py-1 rounded hover:bg-neutral-800 transition text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(s)}
                                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition cursor-pointer"
                                title="Edit Service"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteService(s.id)}
                                className="p-1 hover:bg-neutral-800 rounded text-rose-500 hover:text-rose-400 transition cursor-pointer"
                                title="Delete Service"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
