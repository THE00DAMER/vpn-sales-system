/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, CheckCircle2, User, UserCheck, Inbox, Trash2 } from 'lucide-react';

interface Ticket {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_username: string | null;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  last_reply_at: string;
  created_at: string;
}

interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_type: 'admin' | 'user';
  message: string;
  created_at: string;
}

export default function TicketsPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [refreshTrigger]);

  useEffect(() => {
    if (selectedTicketId !== null) {
      fetchMessages(selectedTicketId);
      const interval = setInterval(() => fetchMessages(selectedTicketId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || selectedTicketId === null) return;

    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_type: 'admin', message: replyText })
      });
      if (res.ok) {
        setReplyText('');
        fetchMessages(selectedTicketId);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (ticketId: number) => {
    try {
      await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_type: 'admin', message: '[System: Ticket marked as Resolved]' })
      });
      // Set status in state/DB or trigger reload
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm("Are you sure you want to permanently delete this support ticket? All conversations will be lost.")) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedTicketId(null);
        fetchTickets();
      } else {
        alert("Failed to delete support ticket.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting ticket.");
    }
  };

  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Support Chat Center</h1>
        <p className="text-sm text-neutral-400">Live conversation console with clients submitting tickets through the Telegram Bot.</p>
      </div>

      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex text-xs">
        {/* Sidebar Ticket List */}
        <div className="w-1/3 border-r border-neutral-800 flex flex-col">
          <div className="p-3.5 bg-neutral-950 border-b border-neutral-800 font-bold text-neutral-200">
            Inbox Tickets ({tickets.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60">
            {loading ? (
              <div className="text-center p-8 text-neutral-500 font-mono">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center p-8 text-neutral-500 flex flex-col items-center gap-1.5 font-mono">
                <Inbox className="w-8 h-8 text-neutral-700" />
                No support tickets found.
              </div>
            ) : (
              tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-3 cursor-pointer transition flex flex-col gap-1 ${
                    selectedTicketId === t.id ? 'bg-neutral-950 border-l-4 border-emerald-500' : 'hover:bg-neutral-950/40'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white truncate max-w-[70%]">
                      {t.customer_name}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                      t.status === 'open' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' 
                        : t.status === 'answered'
                        ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-neutral-400 font-medium truncate max-w-[90%]">{t.subject}</p>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {new Date(t.last_reply_at).toLocaleDateString()} at {new Date(t.last_reply_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Conversation Thread */}
        <div className="flex-1 flex flex-col bg-neutral-950">
          {activeTicket ? (
            <>
              {/* Active Header */}
              <div className="p-3.5 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center shadow-lg">
                <div>
                  <h4 className="font-bold text-white text-xs">
                    Inquiry: {activeTicket.subject}
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Client Account: {activeTicket.customer_name} (@{activeTicket.customer_username || 'N/A'})
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleResolve(activeTicket.id)}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded font-extrabold flex items-center gap-1 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Close Ticket
                  </button>
                  <button
                    onClick={() => handleDeleteTicket(activeTicket.id)}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1 rounded font-extrabold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Ticket
                  </button>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-950">
                {messages.map((m) => {
                  const isAdmin = m.sender_type === 'admin';
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-xl shadow-lg text-xs border ${
                        isAdmin 
                          ? 'bg-emerald-500 text-black border-emerald-500 rounded-tr-none' 
                          : 'bg-neutral-900 text-neutral-200 border-neutral-800 rounded-tl-none'
                      }`}>
                        <div className={`font-bold text-[10px] mb-1 flex items-center gap-1 ${
                          isAdmin ? 'text-neutral-900/80' : 'text-neutral-400'
                        }`}>
                          {isAdmin ? <UserCheck className="w-3 h-3 text-neutral-900" /> : <User className="w-3 h-3 text-emerald-400" />}
                          {isAdmin ? 'System Support Staff' : activeTicket.customer_name}
                        </div>
                        <p className="leading-relaxed whitespace-pre-line font-medium">{m.message}</p>
                        <span className={`block text-[9px] mt-1 text-right font-mono ${isAdmin ? 'text-neutral-950/60' : 'text-neutral-500'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2 items-center">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type official response..."
                  className="flex-1 bg-neutral-950 text-neutral-200 text-xs px-3.5 py-2 rounded-lg border border-neutral-800 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  className="p-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-black font-extrabold transition-colors cursor-pointer"
                  disabled={!replyText.trim()}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-neutral-500 gap-1.5 font-sans">
              <MessageSquare className="w-12 h-12 text-neutral-800 animate-pulse" />
              <span>Select a support ticket from the side inbox to start replying.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
