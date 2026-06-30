/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, Smartphone, ShieldCheck, User, MessageSquare } from 'lucide-react';

interface ChatMessage {
  sender: 'bot' | 'user' | 'system';
  text: string;
  timestamp: string;
  keyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
}

export default function TelegramSimulator({ onActivityTriggered }: { onActivityTriggered?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [userId] = useState(() => `tg_user_${Math.floor(100000 + Math.random() * 900000)}`);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Default welcome on load
  useEffect(() => {
    resetBot();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling for admin-pushed messages from the panel
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/telegram/poll-messages/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            data.forEach((msg: any) => {
              setMessages(prev => [
                ...prev,
                {
                  sender: 'bot',
                  text: msg.text,
                  timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            });
            if (onActivityTriggered) {
              onActivityTriggered();
            }
          }
        }
      } catch (err) {
        console.error("Failed to poll admin messages:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [userId, onActivityTriggered]);

  const resetBot = async () => {
    setMessages([
      {
        sender: 'system',
        text: 'Telegram Chat Started. Click /start or type below to interact.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    await sendBotMessage('/start');
  };

  const sendBotMessage = async (textCmd: string, callbackData?: string) => {
    setIsLoading(true);

    // If user command (not simulation trigger)
    if (textCmd && !callbackData) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'user',
          text: textCmd,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    try {
      const response = await fetch('/api/telegram/sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          username: 'tester_vpn',
          firstName: 'Simulated',
          lastName: 'User',
          text: textCmd || undefined,
          callbackQuery: callbackData || undefined
        })
      });

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: data.botResponse,
          keyboard: data.keyboard,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (onActivityTriggered) {
        onActivityTriggered();
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'system',
          text: 'Error connecting to simulation engine.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const txt = inputText;
    setInputText('');
    sendBotMessage(txt);
  };

  const handleCallbackClick = (title: string, callback: string) => {
    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: `Clicked: ${title}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    sendBotMessage('', callback);
  };

  return (
    <div className="w-full max-w-sm h-full flex flex-col bg-neutral-950 border-l border-neutral-800 text-neutral-200 shadow-2xl relative">
      {/* Top Telegram Header */}
      <div className="bg-neutral-900 p-3 flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-black text-sm">
            A
          </div>
          <div>
            <h4 className="font-semibold text-xs leading-none text-white">Atlas VPN Bot</h4>
            <span className="text-[10px] text-emerald-400 font-medium">bot is polling active</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={resetBot} 
            className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white transition-colors"
            title="Restart Bot /start"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Smartphone className="w-4 h-4 text-neutral-500" />
        </div>
      </div>

      {/* Simulated Chat Window */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-950 via-neutral-900 to-neutral-950">
        {messages.map((m, idx) => {
          if (m.sender === 'system') {
            return (
              <div key={idx} className="text-center">
                <span className="inline-block text-[10px] bg-neutral-900 px-2 py-1 rounded text-neutral-400 border border-neutral-800/60 font-mono">
                  {m.text}
                </span>
              </div>
            );
          }

          const isBot = m.sender === 'bot';
          return (
            <div key={idx} className={`flex ${isBot ? 'justify-start' : 'justify-end'} gap-1.5`}>
              {isBot && (
                <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-[10px] text-emerald-400">
                  Bot
                </div>
              )}
              <div className="max-w-[85%] flex flex-col">
                <div className={`p-2.5 rounded-xl text-xs leading-relaxed break-words shadow ${
                  isBot 
                    ? 'bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-tl-none' 
                    : 'bg-emerald-500 text-black font-semibold rounded-tr-none'
                }`}>
                  {/* Handle multiline text beautifully with code block formatting for links */}
                  <div className="whitespace-pre-line">
                    {m.text.split('`').map((part, i) => {
                      if (i % 2 === 1) {
                        return (
                          <code key={i} className="bg-neutral-950 text-emerald-400 px-1 py-0.5 rounded text-[10px] font-mono select-all block mt-1.5 border border-neutral-800">
                            {part}
                          </code>
                        );
                      }
                      return part;
                    })}
                  </div>
                  <span className={`block text-[9px] text-right mt-1 ${isBot ? 'text-neutral-500' : 'text-emerald-900'}`}>
                    {m.timestamp}
                  </span>
                </div>

                {/* Inline Keyboard Render */}
                {isBot && m.keyboard && m.keyboard.length > 0 && (
                  <div className="mt-1.5 space-y-1 w-full">
                    {m.keyboard.map((row, rIdx) => (
                      <div key={rIdx} className="flex gap-1">
                        {row.map((btn, bIdx) => (
                          btn.url ? (
                            <a
                              key={bIdx}
                              href={btn.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-neutral-900 hover:bg-neutral-850 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium py-1.5 px-2 rounded border border-neutral-800 transition duration-150 text-center block"
                            >
                              {btn.text} ↗
                            </a>
                          ) : (
                            <button
                              key={bIdx}
                              onClick={() => handleCallbackClick(btn.text, btn.callback_data!)}
                              className="flex-1 bg-neutral-900 hover:bg-neutral-850 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium py-1.5 px-2 rounded border border-neutral-800 transition duration-150 text-center"
                            >
                              {btn.text}
                            </button>
                          )
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start gap-1.5">
            <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-[10px] text-emerald-400 animate-pulse">
              ...
            </div>
            <div className="bg-neutral-900 p-2.5 rounded-xl text-xs rounded-tl-none animate-pulse text-neutral-500 border border-neutral-800">
              bot is typing...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message input bar */}
      <form onSubmit={handleSubmit} className="p-2 bg-neutral-900 border-t border-neutral-800 flex gap-1.5 items-center">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Type message or support ticket..."
          className="flex-1 bg-neutral-950 text-neutral-200 placeholder-neutral-700 text-xs px-3 py-2 rounded-lg border border-neutral-800 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="submit"
          className="p-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-black transition-colors shadow disabled:opacity-50"
          disabled={!inputText.trim() || isLoading}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Quick Help Footer */}
      <div className="p-2 bg-neutral-950 border-t border-neutral-850 text-[10px] text-neutral-500 flex justify-between items-center px-3">
        <span>Telegram App Simulator</span>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <ShieldCheck className="w-3 h-3" /> Encrypted Link Engine
        </span>
      </div>
    </div>
  );
}
