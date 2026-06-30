/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bot, Save, CheckCircle2, RefreshCw, Eye, MessageSquare, Menu, Key, ShieldCheck } from 'lucide-react';

interface BotMenuButton {
  id: string;
  title_en: string;
  title_fa: string;
  callback: string;
  active: boolean;
}

export default function BotSettingsPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [buttons, setButtons] = useState<BotMenuButton[]>([]);
  const [botToken, setBotToken] = useState('');
  const [botAdminId, setBotAdminId] = useState('');
  const [welcomeEn, setWelcomeEn] = useState('');
  const [welcomeFa, setWelcomeFa] = useState('');
  const [helpEn, setHelpEn] = useState('');
  const [helpFa, setHelpFa] = useState('');
  const [videoTutorialUrl, setVideoTutorialUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [viewLanguage, setViewLanguage] = useState<'en' | 'fa'>('en');

  const fetchBotSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setButtons(data.bot_menu.buttons);
      setBotToken(data.bot_token || '');
      setBotAdminId(data.bot_admin_id || '');
      setWelcomeEn(data.bot_texts.welcome_en);
      setWelcomeFa(data.bot_texts.welcome_fa);
      setHelpEn(data.bot_texts.help_en);
      setHelpFa(data.bot_texts.help_fa);
      setVideoTutorialUrl(data.video_tutorial_url || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotSettings();
  }, [refreshTrigger]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_token: botToken,
          bot_admin_id: botAdminId,
          bot_menu: { buttons },
          bot_texts: {
            welcome_en: welcomeEn,
            welcome_fa: welcomeFa,
            help_en: helpEn,
            help_fa: helpFa
          },
          video_tutorial_url: videoTutorialUrl
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

  const handleButtonChange = (id: string, field: keyof BotMenuButton, val: any) => {
    setButtons(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b));
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading bot configurations...</div>;
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Telegram Bot Configurator</h1>
          <p className="text-sm text-neutral-400 font-sans">Modify bot button menus, interactive commands, and multilingual greeting screens dynamically.</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-xl">
          <CheckCircle2 className="w-4 h-4" /> Telegram Bot buttons and system texts updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buttons Editor (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bot Connection & Credentials */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
            <h3 className="font-semibold text-sm text-white flex items-center gap-1.5 font-sans">
              <Bot className="w-4 h-4 text-emerald-400" /> Bot Connection & Credentials
            </h3>
            <p className="text-[11px] text-neutral-400">
              Set your real-time Telegram Bot Token and the numeric Chat ID of the primary owner admin so notifications function correctly.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Telegram Bot Token (توکن ربات)</label>
                <input
                  type="text"
                  value={botToken}
                  onChange={e => setBotToken(e.target.value)}
                  placeholder="e.g. 7192849182:AAH..."
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Admin Chat ID (آیدی عددی ادمین)</label>
                <input
                  type="text"
                  value={botAdminId}
                  onChange={e => setBotAdminId(e.target.value)}
                  placeholder="e.g. 123456789"
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="font-semibold text-neutral-300">Private Video Tutorials Group URL</label>
                <input
                  type="text"
                  value={videoTutorialUrl}
                  onChange={e => setVideoTutorialUrl(e.target.value)}
                  placeholder="e.g. https://t.me/+join_link"
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
                <p className="text-[10px] text-neutral-500">
                  This link will be sent when users click the "Video Tutorials Group" button.
                </p>
              </div>
            </div>
          </div>

          {/* Welcome texts */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
            <h3 className="font-semibold text-sm text-white flex items-center gap-1.5 font-sans">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Multilingual Greeting Messages
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Welcome Text (English 🇺🇸)</label>
                <textarea
                  value={welcomeEn} onChange={e => setWelcomeEn(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 h-16"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Welcome Text (Farsi 🇮🇷)</label>
                <textarea
                  value={welcomeFa} onChange={e => setWelcomeFa(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 h-16 text-right"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Help Command (English 🇺🇸)</label>
                <textarea
                  value={helpEn} onChange={e => setHelpEn(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 h-16"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Help Command (Farsi 🇮🇷)</label>
                <textarea
                  value={helpFa} onChange={e => setHelpFa(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 h-16 text-right"
                />
              </div>
            </div>
          </div>

          {/* Interactive Keyboard */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
            <h3 className="font-semibold text-sm text-white flex items-center gap-1.5 font-sans">
              <Menu className="w-4 h-4 text-emerald-400" /> Inline Button Dispatcher Keyboard
            </h3>

            <div className="space-y-3">
              {buttons.map((btn) => (
                <div key={btn.id} className="p-3 border border-neutral-800 rounded-lg flex flex-wrap items-center justify-between gap-4 bg-neutral-950">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-neutral-500">Button Name (English 🇺🇸)</span>
                      <input
                        type="text" value={btn.title_en} onChange={e => handleButtonChange(btn.id, 'title_en', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-2 py-1 font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-neutral-500">Button Name (Farsi 🇮🇷)</span>
                      <input
                        type="text" value={btn.title_fa} onChange={e => handleButtonChange(btn.id, 'title_fa', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-2 py-1 font-medium focus:outline-none focus:border-emerald-500 text-right"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-neutral-500">Callback String Key</span>
                      <input
                        type="text" readOnly value={btn.callback}
                        className="w-full bg-neutral-950 border border-neutral-800 text-neutral-400 rounded px-2 py-1 font-mono text-[10px] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <input
                      type="checkbox" id={`btn_act_${btn.id}`} checked={btn.active} onChange={e => handleButtonChange(btn.id, 'active', e.target.checked)}
                      className="w-4 h-4 text-emerald-500 bg-neutral-900 border-neutral-800 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor={`btn_act_${btn.id}`} className="font-semibold text-neutral-300 cursor-pointer select-none">
                      Active
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2 px-5 rounded-lg shadow-xl flex items-center gap-1.5 transition"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Live Smartphone Interactive Preview (Right 1 column) */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <h3 className="font-semibold text-sm text-white flex items-center gap-1.5 font-sans">
                <Eye className="w-4 h-4 text-emerald-400" /> Menu Visual Preview
              </h3>
              <div className="flex bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                <button
                  type="button" onClick={() => setViewLanguage('en')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer select-none ${viewLanguage === 'en' ? 'bg-neutral-850 text-emerald-400' : 'text-neutral-500'}`}
                >
                  EN
                </button>
                <button
                  type="button" onClick={() => setViewLanguage('fa')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer select-none ${viewLanguage === 'fa' ? 'bg-neutral-850 text-emerald-400' : 'text-neutral-500'}`}
                >
                  FA
                </button>
              </div>
            </div>

            {/* Smart Phone Wrapper Mockup */}
            <div className="bg-neutral-950 rounded-2xl p-4 border-4 border-neutral-800 shadow-2xl max-w-xs mx-auto text-[11px] font-sans text-neutral-100 relative min-h-[18rem] flex flex-col justify-between">
              {/* Top Notch and Signal Info */}
              <div className="flex justify-between items-center text-[8px] text-neutral-500 font-medium px-2 pb-2">
                <span>09:41 AM</span>
                <span className="flex items-center gap-1">5G 📶 100% 🔋</span>
              </div>

              {/* Chat Area Bubble */}
              <div className="flex-1 flex flex-col justify-end py-4">
                <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-[10px] leading-relaxed break-words rounded-tl-none text-neutral-200">
                  {viewLanguage === 'en' ? welcomeEn : welcomeFa}
                </div>
              </div>

              {/* Live Layout Grid of keyboard buttons */}
              <div className="space-y-1 pt-2 border-t border-neutral-900">
                {buttons
                  .filter(b => b.active)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="bg-neutral-900 border border-neutral-800 py-1.5 px-2.5 rounded text-emerald-400 text-center text-[10px] font-semibold cursor-not-allowed select-none"
                    >
                      {viewLanguage === 'fa' ? b.title_fa : b.title_en}
                    </div>
                  ))}
              </div>
            </div>
            <p className="text-[10px] text-neutral-500 text-center">Interactive preview is fully reactive to inputs above.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
