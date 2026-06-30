/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Cpu, Database, Activity, RefreshCw } from 'lucide-react';

interface HealthCheckData {
  status: string;
  checks: { [key: string]: string };
  system: {
    version: string;
    uptime: number;
    databaseSize: number;
    registeredCustomers: number;
    provisionedServices: number;
  };
}

export default function HealthcheckPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [data, setData] = useState<HealthCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/healthcheck');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setBtnLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [refreshTrigger]);

  const triggerDiagnostic = () => {
    setBtnLoading(true);
    setTimeout(() => {
      fetchHealth();
    }, 1000);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Executing system diagnostic tests...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-red-500 text-xs">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-2 animate-bounce" />
        Failed to communicate with diagnostic endpoint.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">System Health Check</h1>
          <p className="text-sm text-neutral-400 font-sans">Run a checklist of Node services, database schemas, directory permissions, and Telegram Bot credentials.</p>
        </div>
        <button
          onClick={triggerDiagnostic} disabled={btnLoading}
          className="bg-neutral-900 border border-neutral-800 text-neutral-200 hover:bg-neutral-850 hover:text-white text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 transition shadow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${btnLoading ? 'animate-spin' : ''}`} />
          {btnLoading ? 'Running Checks...' : 'Run Diagnostics'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left checks list */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden">
            <div className="p-3.5 bg-neutral-950 border-b border-neutral-800 font-bold text-neutral-200">
              System Dependencies Checklist
            </div>
            <div className="divide-y divide-neutral-850">
              {Object.entries(data.checks).map(([label, status]) => (
                <div key={label} className="p-3.5 flex items-center justify-between">
                  <span className="font-semibold text-neutral-300">{label}</span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono">
                      {status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right stats panel */}
        <div className="space-y-6">
          <div className="bg-neutral-900 text-neutral-100 p-5 rounded-xl shadow-xl space-y-4 border border-neutral-800">
            <h3 className="font-semibold text-sm flex items-center gap-1.5 text-white font-sans">
              <Cpu className="w-4 h-4 text-emerald-400" /> Server Telemetry Stats
            </h3>

            <div className="space-y-3.5 text-neutral-300 font-medium">
              <div className="flex justify-between py-1 border-b border-neutral-850">
                <span>Core Framework:</span>
                <span className="font-mono text-white text-[11px]">Express v4.21 (React SPA)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-850">
                <span>Database File:</span>
                <span className="font-mono text-white text-[11px]">
                  {(data.system.databaseSize / 1024).toFixed(2)} KB
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-850">
                <span>Bot Users:</span>
                <span className="font-mono text-emerald-400 text-[11px] font-bold">
                  {data.system.registeredCustomers} active
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-850">
                <span>Sub Links Issued:</span>
                <span className="font-mono text-emerald-400 text-[11px] font-bold">
                  {data.system.provisionedServices} configs
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Uptime Duration:</span>
                <span className="font-mono text-neutral-500 text-[10px]">
                  {Math.floor(data.system.uptime)} seconds
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
