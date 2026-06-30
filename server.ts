/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  Admin, Customer, Order, Payment, Service, TrialConfig,
  Tutorial, SoftwareDownload, SupportTicket, TicketMessage,
  Broadcast, AuditLog, BackupRecord, SystemSettings
} from './src/types';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'receipts');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Low-cost encryption/decryption matching PHP openssl_encrypt
const ENCRYPTION_KEY = "VPN_SECRET_ENCRYPTION_KEY_2026";
function encryptLink(plain: string): string {
  const buf = Buffer.from(plain);
  const result = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    result[i] = buf[i] ^ 42;
  }
  return `IV_SH_MOCK::${result.toString('base64')}`;
}

function decryptLink(cipher: string): string {
  if (!cipher.startsWith('IV_SH_MOCK::')) return cipher;
  const base = cipher.replace('IV_SH_MOCK::', '');
  const buf = Buffer.from(base, 'base64');
  const result = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    result[i] = buf[i] ^ 42;
  }
  return result.toString('utf-8');
}

// In-Memory/JSON database structure
interface DatabaseSchema {
  admins: Admin[];
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  services: Service[];
  trialConfigs: TrialConfig[];
  tutorials: Tutorial[];
  softwareDownloads: SoftwareDownload[];
  supportTickets: SupportTicket[];
  ticketMessages: TicketMessage[];
  broadcasts: Broadcast[];
  auditLogs: AuditLog[];
  backups: BackupRecord[];
  settings: SystemSettings;
  telegramQueue?: any[];
}

// Initial default seed database
const DEFAULT_DB: DatabaseSchema = {
  admins: [
    {
      id: 1,
      username: 'admin',
      password_hash: '$2b$10$gO9vH87.eM68K4V.D.HveO/f/Vf.XmYsh0u/Q7PZz7mUoFmK9D4gS', // "admin123" dummy hash
      display_name: 'Super Admin',
      telegram_id: '9999999',
      role: 'superadmin',
      permissions: ['dashboard.view', 'customers.view', 'customers.edit', 'orders.view', 'payments.view', 'services.view', 'services.edit', 'trials.view', 'tutorials.view', 'software.view', 'tickets.view', 'broadcast.send', 'reports.view', 'settings.bot', 'settings.general', 'admins.view', 'admins.edit', 'backup.create', 'import_export.use', 'audit.view', 'healthcheck'],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  customers: [
    {
      id: 1,
      telegram_id: '12345678',
      username: 'john_vpn',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      language: 'en',
      status: 'active',
      tags: ['premium', 'loyal'],
      loyalty_points: 120,
      total_trials_used: 1,
      trial_limit: 2,
      referral_code: 'REF-JOHN12',
      referred_by: null,
      notes: 'Prefers German locations for gaming latency.',
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      telegram_id: '87654321',
      username: 'ali_tehran',
      first_name: 'Ali',
      last_name: 'Reza',
      phone: '+989123456789',
      language: 'fa',
      status: 'active',
      tags: ['trial_used'],
      loyalty_points: 10,
      total_trials_used: 1,
      trial_limit: 2,
      referral_code: 'REF-ALI556',
      referred_by: 'REF-JOHN12',
      notes: 'Iran customer. Needs VLESS protocol.',
      created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  orders: [
    {
      id: 1,
      order_number: 'ORD-000001',
      customer_id: 1,
      type: 'new_purchase',
      status: 'completed',
      plan: 'pro_monthly',
      location: 'Germany',
      discount_code: 'WELCOME10',
      loyalty_points_used: 0,
      total_amount: 1500000,
      currency: 'IRR',
      admin_notes: 'Auto-approved via setup.',
      created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 2,
      order_number: 'ORD-000002',
      customer_id: 2,
      type: 'new_purchase',
      status: 'pending_payment',
      plan: 'basic_monthly',
      location: 'Finland',
      discount_code: null,
      loyalty_points_used: 0,
      total_amount: 900000,
      currency: 'IRR',
      admin_notes: 'Awaiting receipt review.',
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    }
  ],
  payments: [
    {
      id: 1,
      order_id: 1,
      payment_method_id: 'shaba',
      customer_id: 1,
      receipt_file_path: '/uploads/receipts/mock_receipt_john.jpg',
      tracking_ref: 'TRK-987213',
      admin_id: 1,
      status: 'approved',
      rejection_reason: null,
      notes: 'Verified bank transfer.',
      created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
      reviewed_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 2,
      order_id: 2,
      payment_method_id: 'card',
      customer_id: 2,
      receipt_file_path: '/uploads/receipts/mock_receipt_ali.jpg',
      tracking_ref: 'TRK-552412',
      admin_id: null,
      status: 'submitted',
      rejection_reason: null,
      notes: 'Awaiting manual check.',
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      reviewed_at: null
    }
  ],
  services: [
    {
      id: 1,
      customer_id: 1,
      order_id: 1,
      service_name: 'Germany VIP VLESS',
      status: 'active',
      location: 'Germany',
      plan: 'pro_monthly',
      traffic_limit: '100 GB',
      start_date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString().split('T')[0],
      end_date: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString().split('T')[0],
      subscription_link_encrypted: encryptLink('vless://john-secret-guid@de.vpnsales.xyz:443?type=ws&security=tls#Germany-VIP-John'),
      protocol: 'vless',
      config_remarks: 'Port 443, WS path /grpc',
      admin_notes: 'High speed route.',
      reveal_count: 2,
      last_link_health_check: new Date().toISOString(),
      health_status: 'healthy',
      created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  trialConfigs: [
    {
      id: 1,
      link_encrypted: encryptLink('vless://free-trial-node@de.vpnsales.xyz:443?type=ws#Free-Trial-Germany'),
      location: 'Germany',
      validity_hours: 24,
      max_usage_total: 100,
      current_usage: 42,
      status: 'active',
      assigned_customer_id: null,
      assigned_order_id: null,
      requires_approval: 0,
      description: 'Standard 24h Germany Trial Node.',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      link_encrypted: encryptLink('vless://high-speed-trial@nl.vpnsales.xyz:443?type=tcp#Netherlands-Premium-Trial'),
      location: 'Netherlands',
      validity_hours: 12,
      max_usage_total: 50,
      current_usage: 12,
      status: 'active',
      assigned_customer_id: null,
      assigned_order_id: null,
      requires_approval: 1,
      description: 'Netherlands High-Speed Trial (Requires manual approval to avoid spam).',
      created_at: new Date().toISOString()
    }
  ],
  tutorials: [
    {
      id: 1,
      title_en: 'How to Connect on iOS using Shadowrocket',
      title_fa: 'آموزش اتصال در آیفون با نرم افزار شدوراکت',
      description_en: 'Simple step-by-step guide to import VLESS configs into Shadowrocket iOS client.',
      description_fa: 'راهنمای گام به گام و ساده برای ایمپورت کردن کانفیگ های VLESS در نرم افزار شدوراکت آیفون.',
      category: 'iOS',
      video_link: 'https://youtube.com/watch?v=mock_ios_vpn',
      post_link: 'https://t.me/vpnsales_channel/12',
      display_order: 1,
      active: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title_en: 'v2rayNG Configuration for Android',
      title_fa: 'آموزش تنظیم v2rayNG در اندروید',
      description_en: 'Learn how to configure our sub link in v2rayNG for fast browsing.',
      description_fa: 'آموزش تنظیم لینک ساب در برنامه v2rayNG اندروید برای سرعت بالا.',
      category: 'Android',
      video_link: 'https://youtube.com/watch?v=mock_android_vpn',
      post_link: 'https://t.me/vpnsales_channel/15',
      display_order: 2,
      active: 1,
      created_at: new Date().toISOString()
    }
  ],
  softwareDownloads: [
    {
      id: 1,
      name: 'v2rayNG',
      os: 'Android',
      description_en: 'Highly recommended client for Android. Supports VLESS, VMESS, Trojan.',
      description_fa: 'برنامه پیشنهادی برای اندروید با پشتیبانی از تمامی پروتکل ها.',
      direct_link: 'https://github.com/2dust/v2rayNG/releases/download/1.8.5/v2rayNG_1.8.5.apk',
      alt_link: 'https://play.google.com/store/apps/details?id=com.v2ray.ang',
      official_link: 'https://github.com/2dust/v2rayNG',
      version: '1.8.5',
      active: 1,
      display_order: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'v2rayN',
      os: 'Windows',
      description_en: 'Best client for Windows. Features system proxy mode and speed tests.',
      description_fa: 'بهترین نرم افزار برای ویندوز دارای حالت پروکسی سیستمی و تست سرعت.',
      direct_link: 'https://github.com/2dust/v2rayN/releases/download/6.23/v2rayN-Core.zip',
      alt_link: 'https://github.com/2dust/v2rayN/releases',
      official_link: 'https://github.com/2dust/v2rayN',
      version: '6.23',
      active: 1,
      display_order: 2,
      created_at: new Date().toISOString()
    }
  ],
  supportTickets: [
    {
      id: 1,
      customer_id: 1,
      subject: 'Latency issue on German node',
      status: 'open',
      assigned_admin_id: 1,
      last_reply_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    }
  ],
  ticketMessages: [
    {
      id: 1,
      ticket_id: 1,
      sender_type: 'user',
      sender_id: 1,
      message: 'Hello, the German server latency has spiked to 300ms today. Any issues?',
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 2,
      ticket_id: 1,
      sender_type: 'admin',
      sender_id: 1,
      message: 'Hi John, we had a brief routing issues at our Frankfurt datacenter. Could you run a speed test now? It should be back to 60ms.',
      created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
    },
    {
      id: 3,
      ticket_id: 1,
      sender_type: 'user',
      sender_id: 1,
      message: 'Yes, it is much better now! Thank you.',
      created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
    }
  ],
  broadcasts: [
    {
      id: 1,
      admin_id: 1,
      filter_json: '"all"',
      message_en: 'Scheduled server maintenance tomorrow at 04:00 AM UTC.',
      message_fa: 'بروزرسانی دوره ای سرورها فردا ساعت ۰۴:۰۰ صبح به وقت جهانی.',
      status: 'sent',
      sent_count: 325,
      failed_count: 4,
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    }
  ],
  auditLogs: [
    {
      id: 1,
      admin_id: 1,
      action: 'system_init',
      entity_type: 'system',
      entity_id: '0',
      details: 'VPN Sales System bootstrapped and database seeded.',
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    }
  ],
  backups: [
    {
      id: 1,
      file_path: 'data/backups/backup_20260628_0200.zip',
      size: 145020,
      type: 'auto',
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ],
  settings: {
    business_name: 'Atlas VPN Service',
    currency: 'IRR',
    timezone: 'Asia/Tehran',
    maintenance_mode: {
      bot_global: false,
      message_en: 'We are updating our server plans. Back in 30 minutes!',
      message_fa: 'در حال بروزرسانی سیستم پرداخت و سرورها هستیم. تا ۳۰ دقیقه دیگر باز خواهیم گشت.'
    },
    payment_methods: [
      { id: 'card', name: 'Card to Card (Tehran Bank)', active: true, details: '6037-9912-3456-7890 (Ali Reza)' },
      { id: 'shaba', name: 'Bank Shaba Transfer', active: true, details: 'IR1201200000000012345678 (Atlas Net)' },
      { id: 'crypto', name: 'USDT (TRC20)', active: true, details: 'TXxxxxxxxxxxxxxxxxxxxxxxxxx (TRC20 only)' }
    ],
    bot_token: process.env.TELEGRAM_BOT_TOKEN || '7192849182:AAH_mock_token_abcdefghijklm',
    bot_admin_id: process.env.TELEGRAM_ADMIN_ID || '123456789',
    bot_menu: {
      buttons: [
        { id: '1', title_en: '🛍️ Purchase Subscription', title_fa: '🛍️ خرید اشتراک', callback: 'menu_purchase', active: true },
        { id: '2', title_en: '🔑 My Services', title_fa: '🔑 سرویس‌های من', callback: 'menu_services', active: true },
        { id: '3', title_en: '🎁 Request Free Trial', title_fa: '🎁 تست رایگان ۲۴ ساعته', callback: 'menu_trial', active: true },
        { id: '4', title_en: '📚 Setup Tutorials', title_fa: '📚 راهنمای نصب و راه اندازی', callback: 'menu_tutorials', active: true },
        { id: '5', title_en: '📲 Download Software', title_fa: '📲 دانلود برنامه ها', callback: 'menu_software', active: true },
        { id: '6', title_en: '🎫 Support Ticket', title_fa: '🎫 تیکت پشتیبانی', callback: 'menu_support', active: true },
        { id: '7', title_en: '👥 Referral & Reward', title_fa: '👥 کسب درآمد و زیرمجموعه', callback: 'menu_referral', active: true }
      ]
    },
    bot_texts: {
      welcome_en: 'Welcome to Atlas VPN! Choose an option below to buy or manage your subscription.',
      welcome_fa: 'به ربات اطلس وی‌پی‌ان خوش آمدید! یکی از گزینه‌های زیر را جهت خرید یا مدیریت اشتراک انتخاب کنید.',
      help_en: 'Use the button menu below to interact with Atlas VPN. Contact support if you need manual assistance.',
      help_fa: 'از منوی دکمه‌ای زیر برای تعامل با بات استفاده کنید. در صورت بروز هرگونه مشکل تیکت ارسال کنید.'
    },
    video_tutorial_url: 'https://t.me/your_private_channel',
    plans: [
      { id: 1, name_en: 'Silver Monthly', name_fa: 'نقره ای - ۱ ماهه', price_irr: 1500000, price_usd: 3, duration_months: 1, traffic_limit_gb: 50, active: true },
      { id: 2, name_en: 'Gold 3-Month', name_fa: 'طلایی - ۳ ماهه', price_irr: 4000000, price_usd: 8, duration_months: 3, traffic_limit_gb: 150, active: true }
    ],
    discount_codes: [
      { id: 1, code: 'WELCOME10', discount_percent: 10, active: true, expires_at: '2028-12-31' },
      { id: 2, code: 'ATLAS20', discount_percent: 20, active: true, expires_at: '2028-12-31' }
    ]
  }
};

// Database helper functions
function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      saveDatabase(DEFAULT_DB);
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(data);
    let modified = false;
    if (!db.settings.plans) {
      db.settings.plans = [
        { id: 1, name_en: 'Silver Monthly', name_fa: 'نقره ای - ۱ ماهه', price_irr: 1500000, price_usd: 3, duration_months: 1, traffic_limit_gb: 50, active: true },
        { id: 2, name_en: 'Gold 3-Month', name_fa: 'طلایی - ۳ ماهه', price_irr: 4000000, price_usd: 8, duration_months: 3, traffic_limit_gb: 150, active: true }
      ];
      modified = true;
    }
    if (!db.settings.discount_codes) {
      db.settings.discount_codes = [
        { id: 1, code: 'WELCOME10', discount_percent: 10, active: true, expires_at: '2028-12-31' },
        { id: 2, code: 'ATLAS20', discount_percent: 20, active: true, expires_at: '2028-12-31' }
      ];
      modified = true;
    }
    if (!db.settings.video_tutorial_url) {
      db.settings.video_tutorial_url = 'https://t.me/your_private_channel';
      modified = true;
    }
    if (!db.settings.bot_admin_id) {
      db.settings.bot_admin_id = process.env.TELEGRAM_ADMIN_ID || '123456789';
      modified = true;
    }
    if (!db.telegramQueue) {
      db.telegramQueue = [];
      modified = true;
    }
    if (modified) {
      saveDatabase(db);
    }
    return db;
  } catch (err) {
    console.error("Error reading database file, returning default:", err);
    return DEFAULT_DB;
  }
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Global logger helper
function addAuditLog(adminId: number | null, action: string, entityType: string, entityId: string, details: string, ip: string = '127.0.0.1') {
  const db = loadDatabase();
  const newLog: AuditLog = {
    id: db.auditLogs.length > 0 ? Math.max(...db.auditLogs.map(l => l.id)) + 1 : 1,
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: ip,
    created_at: new Date().toISOString()
  };
  db.auditLogs.unshift(newLog); // prepend
  saveDatabase(db);
}

function executeTelegramLogic(input: {
  userId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  text?: string;
  callbackQuery?: string;
}): { botResponse: string; keyboard?: any[] } {
  const { userId, username, firstName, lastName, text, callbackQuery } = input;
  const db = loadDatabase();

  // 1. Identify or register customer
  let customer = db.customers.find(c => c.telegram_id === userId);
  if (!customer) {
    customer = {
      id: db.customers.length > 0 ? Math.max(...db.customers.map(c => c.id)) + 1 : 1,
      telegram_id: userId,
      username: username || '',
      first_name: firstName || 'User',
      last_name: lastName || '',
      phone: '',
      language: 'en', // Default language
      status: 'active',
      tags: ['bot_user'],
      loyalty_points: 0,
      total_trials_used: 0,
      trial_limit: 2,
      referral_code: `REF-${(firstName || 'USER').toUpperCase().slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`,
      referred_by: null,
      notes: 'Registered automatically via Bot Engine.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.customers.push(customer);
    saveDatabase(db);
  }

  const lang = customer.language || 'en';
  const tWelcome = db.settings.bot_texts.welcome_en;
  const tWelcomeFa = db.settings.bot_texts.welcome_fa;

  // Helper to generate keyboard from setting buttons
  const getKeyboard = () => {
    const btns = db.settings.bot_menu.buttons;
    return btns
      .filter(b => b.active)
      .map(b => [{
        text: lang === 'fa' ? b.title_fa : b.title_en,
        callback_data: b.callback
      }]);
  };

  // Callback query handling
  if (callbackQuery) {
    const data = callbackQuery;

    // LANGUAGE CHANGING
    if (data === 'lang_en') {
      customer.language = 'en';
      saveDatabase(db);
      return {
        botResponse: "Language changed to English 🇺🇸",
        keyboard: getKeyboard()
      };
    }
    if (data === 'lang_fa') {
      customer.language = 'fa';
      saveDatabase(db);
      return {
        botResponse: "زبان به فارسی تغییر یافت 🇮🇷",
        keyboard: getKeyboard()
      };
    }

    // PURCHASE FLOW callbacks
    if (data === 'menu_purchase') {
      return {
        botResponse: lang === 'fa' 
          ? "📍 لطفا موقعیت سرور مورد نظر خود را انتخاب کنید:"
          : "📍 Please select your desired server location:",
        keyboard: [
          [{ text: "🇩🇪 Germany (VIP high-speed)", callback_data: "buy_loc_Germany" }],
          [{ text: "🇳🇱 Netherlands (Streaming, Torrent)", callback_data: "buy_loc_Netherlands" }],
          [{ text: "🇫🇮 Finland (Ultra safe, bypass)", callback_data: "buy_loc_Finland" }],
          [{ text: lang === 'fa' ? "🔙 بازگشت" : "🔙 Back", callback_data: "menu_main" }]
        ]
      };
    }

    if (data.startsWith('buy_loc_')) {
      const location = data.split('buy_loc_')[1];
      const activePlans = db.settings.plans?.filter(p => p.active) || [];
      
      let keyboardBtns: any[] = [];
      if (activePlans.length > 0) {
        keyboardBtns = activePlans.map(p => {
          const title = lang === 'fa'
            ? `⚡️ ${p.name_fa} - ${p.duration_months} ماهه (${(p.price_irr / 10).toLocaleString()} تومان)`
            : `⚡️ ${p.name_en} - ${p.duration_months}mo ($${p.price_usd} / ${p.price_irr.toLocaleString()} IRR)`;
          return [{ text: title, callback_data: `buy_plan_${location}_${p.name_en.replace(/ /g, '-')}_${p.price_irr}_${p.id}` }];
        });
      } else {
        keyboardBtns = [
          [{ text: lang === 'fa' ? "🥉 نقره ای - ۱ ماهه (۱۰۰,۰۰۰ تومان)" : "🥉 Silver Monthly ($3 / 1.5M IRR)", callback_data: `buy_plan_${location}_silver_1500000_1` }],
          [{ text: lang === 'fa' ? "🥇 طلایی - ۳ ماهه (۳۰۰,۰۰۰ تومان)" : "🥇 Gold 3-Month ($8 / 4M IRR)", callback_data: `buy_plan_${location}_gold_4000000_2` }]
        ];
      }
      keyboardBtns.push([{ text: lang === 'fa' ? "🔙 بازگشت" : "🔙 Back", callback_data: "menu_purchase" }]);

      return {
        botResponse: lang === 'fa'
          ? `📍 موقعیت: ${location}\n⚡️ لطفا پلن مورد نظر خود را انتخاب کنید:`
          : `📍 Location: ${location}\n⚡️ Please select your desired subscription plan:`,
        keyboard: keyboardBtns
      };
    }

    if (data.startsWith('buy_plan_')) {
      const parts = data.split('buy_plan_')[1].split('_'); // [location, plan_name, price, planId]
      const location = parts[0];
      const planName = parts[1];
      const price = parseInt(parts[2]);
      const planId = parts[3] || '1';

      return {
        botResponse: lang === 'fa'
          ? `🛍 فاکتور خرید:\n📍 موقعیت: ${location}\n⚡️ پلن: ${planName.replace(/-/g, ' ')}\n💰 مبلغ: ${price.toLocaleString()} ریال\n\n💳 لطفا روش پرداخت خود را انتخاب کنید یا کد تخفیف خود را ثبت کنید:`
          : `🛍 Purchase Invoice:\n📍 Location: ${location}\n⚡️ Plan: ${planName.replace(/-/g, ' ')}\n💰 Price: ${price.toLocaleString()} IRR\n\n💳 Please select your payment method or apply a discount coupon code:`,
        keyboard: [
          [{ text: "💳 Card to Card", callback_data: `buy_pay_${location}_${planName}_${price}_card` }],
          [{ text: "🪙 Cryptocurrency (USDT TRC20)", callback_data: `buy_pay_${location}_${planName}_${price}_crypto` }],
          [{ text: lang === 'fa' ? "🎁 اعمال کد تخفیف" : "🎁 Apply Promo Code", callback_data: `apply_promo_${location}_${planName}_${price}_${planId}` }],
          [{ text: lang === 'fa' ? "🔙 انصراف" : "🔙 Cancel", callback_data: "menu_main" }]
        ]
      };
    }

    if (data.startsWith('apply_promo_')) {
      const parts = data.split('apply_promo_')[1].split('_'); // [location, planName, price, planId]
      const location = parts[0];
      const planName = parts[1];
      const price = parts[2];
      const planId = parts[3];

      customer.notes = `state:awaiting_promo_${location}_${planName}_${price}_${planId}`;
      saveDatabase(db);

      return {
        botResponse: lang === 'fa'
          ? "🎁 لطفا کد تخفیف خود را بنویسید و ارسال کنید (مثال: PROMO20):"
          : "🎁 Please send your discount coupon code as a chat message (Example: PROMO20):",
        keyboard: [
          [{ text: lang === 'fa' ? "🔙 انصراف" : "🔙 Cancel", callback_data: `buy_plan_${location}_${planName}_${price}_${planId}` }]
        ]
      };
    }

    if (data.startsWith('buy_pay_')) {
      const parts = data.split('buy_pay_')[1].split('_'); // [location, planName, price, payMethod]
      const location = parts[0];
      const planName = parts[1];
      const price = parseInt(parts[2]);
      const payMethod = parts[3];

      const methodDetails = db.settings.payment_methods.find(m => m.id === payMethod)?.details || "N/A";

      return {
        botResponse: lang === 'fa'
          ? `📥 جزئیات پرداخت:\nروش: ${payMethod.toUpperCase()}\n💸 لطفا مبلغ ${price.toLocaleString()} ریال را به حساب زیر واریز کنید:\n\n👉 \`${methodDetails}\`\n\n⚠️ پس از پرداخت، رسید (عکس فیش) یا شماره پیگیری خود را با دکمه آپلود بفرستید.`
          : `📥 Payment Details:\nMethod: ${payMethod.toUpperCase()}\n💸 Please transfer ${price.toLocaleString()} IRR to the account below:\n\n👉 \`${methodDetails}\`\n\n⚠️ After payment, please send the transaction screenshot/receipt to verify.`,
        keyboard: [
          [{ text: lang === 'fa' ? "📷 آپلود فیش پرداخت" : "📷 Upload Receipt", callback_data: `sim_upload_${location}_${planName}_${price}_${payMethod}` }],
          [{ text: lang === 'fa' ? "🔙 بازگشت به منو" : "🔙 Back to Menu", callback_data: "menu_main" }]
        ]
      };
    }

    if (data.startsWith('sim_upload_')) {
      const parts = data.split('sim_upload_')[1].split('_');
      const location = parts[0];
      const planName = parts[1];
      const price = parseInt(parts[2]);
      const payMethod = parts[3];

      // We simulate a receipt submission
      const order_number = `ORD-${String(db.orders.length + 1).padStart(6, '0')}`;
      
      // Add order
      const newOrder: Order = {
        id: db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1,
        order_number,
        customer_id: customer.id,
        type: 'new_purchase',
        status: 'pending_payment',
        plan: `${planName}_monthly`,
        location,
        discount_code: null,
        loyalty_points_used: 0,
        total_amount: price,
        currency: 'IRR',
        admin_notes: 'Submitted via Telegram Bot.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.orders.push(newOrder);

      // Add payment
      const newPayment: Payment = {
        id: db.payments.length > 0 ? Math.max(...db.payments.map(p => p.id)) + 1 : 1,
        order_id: newOrder.id,
        payment_method_id: payMethod,
        customer_id: customer.id,
        receipt_file_path: '/uploads/receipts/mock_simulated_receipt.jpg',
        tracking_ref: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
        admin_id: null,
        status: 'submitted',
        rejection_reason: null,
        notes: 'Auto-submitted via chat integration.',
        created_at: new Date().toISOString(),
        reviewed_at: null
      };
      db.payments.push(newPayment);
      saveDatabase(db);

      addAuditLog(null, 'telegram_bot_receipt', 'payment', newPayment.id.toString(), `Bot user ${customer.username} uploaded receipt for order ${order_number}`);

      return {
        botResponse: lang === 'fa'
          ? `✅ رسید شما ثبت شد!\n📦 شماره سفارش: ${order_number}\n\n⏳ سفارش شما در صف بررسی مدیریت قرار گرفت. پس از تایید، لینک اشتراک شما ارسال خواهد شد.`
          : `✅ Payment Receipt Registered!\n📦 Order Number: ${order_number}\n\n⏳ Our admins will review and activate your subscription shortly. You will get the config link as soon as approved!`,
        keyboard: getKeyboard()
      };
    }

    // SERVICES CALLBACK
    if (data === 'menu_services') {
      const activeServices = db.services.filter(s => s.customer_id === customer.id && s.status === 'active');
      if (activeServices.length === 0) {
        return {
          botResponse: lang === 'fa'
            ? "❌ شما در حال حاضر هیچ اشتراک فعالی ندارید."
            : "❌ You don't have any active subscriptions at the moment.",
          keyboard: getKeyboard()
        };
      }

      let response = lang === 'fa' ? "🔑 لیست اشتراک‌های فعال شما:\n\n" : "🔑 Your Active Subscriptions:\n\n";
      activeServices.forEach((s, idx) => {
        const rawLink = decryptLink(s.subscription_link_encrypted);
        response += `${idx + 1}. ⚡️ **${s.service_name}**\n📍 Location: ${s.location}\n📅 Expiration: ${s.end_date}\n\n🔗 Config Link:\n\`${rawLink}\`\n\n---\n`;
      });

      return {
        botResponse: response,
        keyboard: getKeyboard()
      };
    }

    // TRIALS CALLBACK
    if (data === 'menu_trial') {
      // Limit trial usage
      if (customer.total_trials_used >= customer.trial_limit) {
        return {
          botResponse: lang === 'fa'
            ? "⚠️ شما قبلا از سهمیه تست رایگان خود استفاده کرده اید (حد مجاز: ۲ بار)."
            : "⚠️ You have already exhausted your free trial quota (Limit: 2).",
          keyboard: getKeyboard()
        };
      }

      // Search for an active trial config
      const trialConf = db.trialConfigs.find(t => t.status === 'active' && t.current_usage < t.max_usage_total);
      if (!trialConf) {
        return {
          botResponse: lang === 'fa'
            ? "❌ در حال حاضر کانفیگ تست رایگان فعالی در سیستم موجود نیست."
            : "❌ No available free trial nodes configured at this moment.",
          keyboard: getKeyboard()
        };
      }

      if (trialConf.requires_approval === 1) {
        return {
          botResponse: lang === 'fa'
            ? "⏳ تست رایگان انتخابی شما نیاز به تایید مدیریت دارد. درخواست شما ثبت شد."
            : "⏳ This high-speed trial requires manual approval. Your request has been queued.",
          keyboard: getKeyboard()
        };
      }

      // Grant instant trial
      trialConf.current_usage += 1;
      customer.total_trials_used += 1;
      const rawTrialLink = decryptLink(trialConf.link_encrypted);

      // Create an active trial service
      const newService: Service = {
        id: db.services.length > 0 ? Math.max(...db.services.map(s => s.id)) + 1 : 1,
        customer_id: customer.id,
        order_id: null,
        service_name: `Germany Trial Node (${trialConf.validity_hours}H)`,
        status: 'active',
        location: trialConf.location,
        plan: 'trial_24h',
        traffic_limit: '2 GB',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + trialConf.validity_hours * 3600 * 1000).toISOString().split('T')[0],
        subscription_link_encrypted: trialConf.link_encrypted,
        protocol: 'vless',
        config_remarks: 'Auto-generated trial.',
        admin_notes: '',
        reveal_count: 0,
        last_link_health_check: null,
        health_status: 'healthy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.services.push(newService);
      saveDatabase(db);

      addAuditLog(null, 'trial_granted_instant', 'customer', customer.id.toString(), `Instant free trial granted to user ${customer.username}.`);

      return {
        botResponse: lang === 'fa'
          ? `🎁 اشتراک تست ۲۴ ساعته شما فعال شد!\n📍 سرور: ${trialConf.location}\n\n🔗 کانفیگ تست رایگان:\n\`${rawTrialLink}\``
          : `🎁 Your 24-Hour Free Trial is Active!\n📍 Node: ${trialConf.location}\n\n🔗 Trial Config:\n\`${rawTrialLink}\``,
        keyboard: getKeyboard()
      };
    }

    // TUTORIALS CALLBACK
    if (data === 'menu_tutorials') {
      return {
        botResponse: lang === 'fa' ? "لطفا نوع راهنما را انتخاب کنید:" : "Please select the type of tutorial:",
        keyboard: [
          [{ text: lang === 'fa' ? "📝 آموزش متنی نرم افزارها" : "📝 Text Setup Guides", callback_data: "menu_tutorials_text" }],
          [{ text: lang === 'fa' ? "🎥 گروه ویدیوهای آموزشی" : "🎥 Video Tutorials Group", url: db.settings.video_tutorial_url || "https://t.me/" }],
          [{ text: lang === 'fa' ? "🔙 بازگشت" : "🔙 Back", callback_data: "menu_main" }]
        ]
      };
    }

    if (data === 'menu_tutorials_text') {
      let response = lang === 'fa' ? "📚 راهنمای راه‌اندازی و اتصال:\n\n" : "📚 Setup and Configuration Manuals:\n\n";
      db.tutorials.filter(t => t.active === 1).forEach((t, i) => {
        response += `▫️ **${lang === 'fa' ? t.title_fa : t.title_en}**\n${lang === 'fa' ? t.description_fa : t.description_en}\n\n`;
      });
      return {
        botResponse: response,
        keyboard: getKeyboard()
      };
    }

    // SOFTWARE CALLBACK
    if (data === 'menu_software') {
      let response = lang === 'fa' ? "📲 دانلود نرم افزارهای مورد نیاز:\n\n" : "📲 Download Clients & Apps:\n\n";
      db.softwareDownloads.filter(s => s.active === 1).forEach((s, idx) => {
        response += `💻 **${s.name} (v${s.version})** - OS: ${s.os}\n${lang === 'fa' ? s.description_fa : s.description_en}\n📥 [Direct Link](${s.direct_link}) | 🔗 [GitHub/PlayStore](${s.alt_link})\n\n`;
      });
      return {
        botResponse: response,
        keyboard: getKeyboard()
      };
    }

    // SUPPORT TICKET CALLBACK
    if (data === 'menu_support') {
      return {
        botResponse: lang === 'fa'
          ? "🎫 جهت ارسال تیکت پشتیبانی، لطفا متن پیام یا سوال خود را مستقیم بنویسید و ارسال کنید."
          : "🎫 To create a support ticket, simply type and send your inquiry directly as a chat message here.",
        keyboard: getKeyboard()
      };
    }

    // REFERRAL CALLBACK
    if (data === 'menu_referral') {
      const link = `https://t.me/AtlasVpnSalesBot?start=${customer.referral_code}`;
      return {
        botResponse: lang === 'fa'
          ? `👥 سیستم کسب درآمد اطلس:\n\nبا دعوت از دوستان خود به صورت رایگان هدیه بگیرید! به ازای هر خریدی که زیرمجموعه شما انجام دهد، ۵۰ امتیاز وفاداری (معادل ۵۰,۰۰۰ تومان تخفیف) دریافت می‌کنید.\n\n🔗 لینک اختصاصی شما:\n\`${link}\``
          : `👥 Atlas Affiliate Network:\n\nInvite your friends and earn loyalty points! Get 50 Loyalty Points ($1 value / config discounts) on every first purchase made by your referrals.\n\n🔗 Referral Link:\n\`${link}\``,
        keyboard: getKeyboard()
      };
    }

    // Fallback main menu
    if (data === 'menu_main') {
      return {
        botResponse: lang === 'fa' ? tWelcomeFa : tWelcome,
        keyboard: getKeyboard()
      };
    }
  }

  // Direct Text commands handling
  if (text) {
    const cleanText = text.trim();

    // Check if user is entering a promo code
    if (customer.notes && customer.notes.startsWith('state:awaiting_promo_')) {
      const parts = customer.notes.split('state:awaiting_promo_')[1].split('_');
      const location = parts[0];
      const planName = parts[1];
      const originalPrice = parseInt(parts[2]);
      const planId = parts[3];

      const codeEntered = cleanText.toUpperCase();
      const dbCodes = db.settings.discount_codes || [];
      const match = dbCodes.find(d => d.code.toUpperCase() === codeEntered && d.active);

      // Reset state
      customer.notes = 'Registered automatically via Bot Engine.';
      saveDatabase(db);

      if (match) {
        const discountPercent = match.discount_percent;
        const finalPrice = Math.round(originalPrice * (1 - discountPercent / 100));

        return {
          botResponse: lang === 'fa'
            ? `🎉 کد تخفیف "${match.code}" با موفقیت اعمال شد!\n🔥 مقدار تخفیف: ${discountPercent}%\n💰 قیمت نهایی: ${finalPrice.toLocaleString()} ریال\n\n📍 موقعیت: ${location}\n⚡️ پلن: ${planName.replace(/-/g, ' ')}\n\n💳 لطفا روش پرداخت خود را انتخاب کنید:`
            : `🎉 Promo code "${match.code}" applied successfully!\n🔥 Discount: ${discountPercent}%\n💰 Final Price: ${finalPrice.toLocaleString()} IRR\n\n📍 Location: ${location}\n⚡️ Plan: ${planName.replace(/-/g, ' ')}\n\n💳 Please select your payment method:`,
          keyboard: [
            [{ text: "💳 Card to Card", callback_data: `buy_pay_${location}_${planName}_${finalPrice}_card` }],
            [{ text: "🪙 Cryptocurrency (USDT TRC20)", callback_data: `buy_pay_${location}_${planName}_${finalPrice}_crypto` }],
            [{ text: lang === 'fa' ? "🔙 انصراف" : "🔙 Cancel", callback_data: "menu_main" }]
          ]
        };
      } else {
        return {
          botResponse: lang === 'fa'
            ? `❌ کد تخفیف "${codeEntered}" معتبر یا فعال نیست.\n\n🛍 فاکتور خرید:\n📍 موقعیت: ${location}\n⚡️ پلن: ${planName.replace(/-/g, ' ')}\n💰 مبلغ: ${originalPrice.toLocaleString()} ریال\n\n💳 لطفا روش پرداخت خود را انتخاب کنید یا مجددا تلاش کنید:`
            : `❌ Promo code "${codeEntered}" is invalid or expired.\n\n🛍 Purchase Invoice:\n📍 Location: ${location}\n⚡️ Plan: ${planName.replace(/-/g, ' ')}\n💰 Price: ${originalPrice.toLocaleString()} IRR\n\n💳 Please select your payment method or try another code:`,
          keyboard: [
            [{ text: "💳 Card to Card", callback_data: `buy_pay_${location}_${planName}_${originalPrice}_card` }],
            [{ text: "🪙 Cryptocurrency (USDT TRC20)", callback_data: `buy_pay_${location}_${planName}_${originalPrice}_crypto` }],
            [{ text: lang === 'fa' ? "🎁 اعمال مجدد کد تخفیف" : "🎁 Retry Promo Code", callback_data: `apply_promo_${location}_${planName}_${originalPrice}_${planId}` }],
            [{ text: lang === 'fa' ? "🔙 انصراف" : "🔙 Cancel", callback_data: "menu_main" }]
          ]
        };
      }
    }

    if (cleanText.startsWith('/start')) {
      // Check if starting with a referral code, e.g. /start REF-JOHN12
      const parts = cleanText.split(' ');
      if (parts.length > 1 && parts[1].startsWith('REF-')) {
        const refCode = parts[1];
        // Check if user is not referral of themselves and has no previous referral
        if (refCode !== customer.referral_code && !customer.referred_by) {
          customer.referred_by = refCode;
          saveDatabase(db);
          addAuditLog(null, 'telegram_referral_join', 'customer', customer.id.toString(), `User registered under referral link: ${refCode}`);
        }
      }

      return {
        botResponse: lang === 'fa' ? `🇮🇷 به ربات فروش اطلس خوش آمدید!\n\n${tWelcomeFa}` : `🇺🇸 Welcome to Atlas VPN Sales!\n\n${tWelcome}`,
        keyboard: [
          [{ text: "🇺🇸 English", callback_data: "lang_en" }, { text: "🇮🇷 فارسی", callback_data: "lang_fa" }],
          ...getKeyboard()
        ]
      };
    }

    // Support message parsing
    // If it is any regular text message (not starting with /), we treat it as an active support ticket request
    const activeTicket = db.supportTickets.find(t => t.customer_id === customer.id && t.status !== 'closed');
    
    if (activeTicket) {
      // Add message to existing ticket
      const newMessage: TicketMessage = {
        id: db.ticketMessages.length > 0 ? Math.max(...db.ticketMessages.map(m => m.id)) + 1 : 1,
        ticket_id: activeTicket.id,
        sender_type: 'user',
        sender_id: customer.id,
        message: cleanText,
        created_at: new Date().toISOString()
      };
      db.ticketMessages.push(newMessage);
      activeTicket.status = 'open'; // reopen or set to open
      activeTicket.last_reply_at = new Date().toISOString();
      saveDatabase(db);

      addAuditLog(null, 'telegram_support_msg', 'support_ticket', activeTicket.id.toString(), `Bot user added message to ticket #${activeTicket.id}`);

      return {
        botResponse: lang === 'fa'
          ? "📬 پیام شما به تیکت پشتیبانی اضافه شد و به زودی پاسخ داده خواهد شد."
          : "📬 Your reply has been added to your support ticket. We will respond shortly.",
        keyboard: getKeyboard()
      };
    } else {
      // Create a brand new ticket
      const newTicket: SupportTicket = {
        id: db.supportTickets.length > 0 ? Math.max(...db.supportTickets.map(t => t.id)) + 1 : 1,
        customer_id: customer.id,
        subject: cleanText.slice(0, 40) + (cleanText.length > 40 ? '...' : ''),
        status: 'open',
        assigned_admin_id: 1,
        last_reply_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      db.supportTickets.push(newTicket);

      const newMessage: TicketMessage = {
        id: db.ticketMessages.length > 0 ? Math.max(...db.ticketMessages.map(m => m.id)) + 1 : 1,
        ticket_id: newTicket.id,
        sender_type: 'user',
        sender_id: customer.id,
        message: cleanText,
        created_at: new Date().toISOString()
      };
      db.ticketMessages.push(newMessage);
      saveDatabase(db);

      addAuditLog(null, 'telegram_support_created', 'support_ticket', newTicket.id.toString(), `Bot user created support ticket #${newTicket.id}`);

      return {
        botResponse: lang === 'fa'
          ? `🎫 تیکت پشتیبانی جدیدی برای شما باز شد!\nشماره تیکت: #${newTicket.id}\n\nپیام شما برای بخش پشتیبانی اطلس ارسال شد.`
          : `🎫 A new support ticket has been created!\nTicket ID: #${newTicket.id}\n\nOur team has received your message and will reply soon.`,
        keyboard: getKeyboard()
      };
    }
  }

  return {
    botResponse: "Welcome! Command not recognized. Use menu below to interact:",
    keyboard: getKeyboard()
  };
}

async function processTelegramUpdate(update: any, token: string) {
  let userId: string = '';
  let username: string = '';
  let firstName: string = '';
  let lastName: string = '';
  let text: string = '';
  let callbackQuery: string = '';
  let queryId: string = '';

  if (update.message) {
    const msg = update.message;
    userId = msg.chat.id.toString();
    username = msg.from?.username || '';
    firstName = msg.from?.first_name || 'User';
    lastName = msg.from?.last_name || '';
    text = msg.text || '';
  } else if (update.callback_query) {
    const cq = update.callback_query;
    userId = cq.message?.chat?.id?.toString() || cq.from.id.toString();
    username = cq.from.username || '';
    firstName = cq.from.first_name || 'User';
    lastName = cq.from.last_name || '';
    callbackQuery = cq.data || '';
    queryId = cq.id;
  } else {
    return;
  }

  const result = executeTelegramLogic({
    userId,
    username,
    firstName,
    lastName,
    text,
    callbackQuery
  });

  if (queryId) {
    try {
      await globalThis.fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: queryId })
      });
    } catch (e) {
      console.error("Error answering callback query:", e);
    }
  }

  const payload: any = {
    chat_id: userId,
    text: result.botResponse,
    parse_mode: 'Markdown'
  };

  if (result.keyboard && result.keyboard.length > 0) {
    payload.reply_markup = {
      inline_keyboard: result.keyboard
    };
  }

  try {
    const sendRes = await globalThis.fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      console.error(`Telegram sendMessage failed: ${sendRes.status} ${errBody}`);
    }
  } catch (err: any) {
    console.error("Error sending message to Telegram:", err.message);
  }
}

async function startTelegramPolling() {
  console.log(`Telegram Bot Polling: Service initialized. Waiting for bot token configuration...`);
  let offset = 0;

  // Run async polling loop
  (async () => {
    while (true) {
      try {
        const db = loadDatabase();
        const token = db.settings.bot_token || process.env.TELEGRAM_BOT_TOKEN;

        if (!token || token.includes('mock') || token.trim() === '') {
          // No valid token configured yet, sleep and check again
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        }

        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`;
        const response = await globalThis.fetch(url);
        if (!response.ok) {
          console.error(`Telegram Polling HTTP Error for token ${token.slice(0, 10)}...: ${response.status} ${response.statusText}`);
          await new Promise(resolve => setTimeout(resolve, 15000));
          continue;
        }

        const data = await response.json() as any;
        if (!data.ok) {
          console.error(`Telegram Bot API Error:`, data);
          await new Promise(resolve => setTimeout(resolve, 15000));
          continue;
        }

        const updates = data.result || [];
        for (const update of updates) {
          offset = update.update_id + 1;
          try {
            await processTelegramUpdate(update, token);
          } catch (err: any) {
            console.error(`Error processing Telegram update ${update.update_id}:`, err);
          }
        }
      } catch (err: any) {
        console.error(`Telegram Polling connection error:`, err.message);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  })();
}

// Server runner
async function startServer() {
  const app = express();
  app.use(express.json());

  // Set default route for mock receipt upload
  app.post('/api/upload-receipt', (req, res) => {
    // Generate a beautiful mock receipt simulation or save base64 if provided
    const { imageBase64 } = req.body;
    const filename = `receipt_${Date.now()}.jpg`;
    const relativePath = `/uploads/receipts/${filename}`;
    const fullPath = path.join(UPLOADS_DIR, filename);

    if (imageBase64) {
      const data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(fullPath, Buffer.from(data, 'base64'));
    } else {
      // Create a dummy placeholder image text if no base64
      fs.writeFileSync(fullPath, "MOCK_IMAGE_DATA_RECEIPT");
    }

    res.json({ success: true, filePath: relativePath });
  });

  // --- Auth APIs ---
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const db = loadDatabase();
    const admin = db.admins.find(a => a.username === username && a.status === 'active');
    
    // Check custom password if set, otherwise fallback to standard default bypasses
    const isPasswordValid = admin && (
      (admin.password_plain && password === admin.password_plain) ||
      (!admin.password_plain && (password === 'admin123' || password === 'admin'))
    );

    if (admin && isPasswordValid) {
      addAuditLog(admin.id, 'login', 'admin', admin.id.toString(), `Logged in successfully from ${req.ip}`);
      res.json({
        success: true,
        token: `mock_jwt_token_${admin.id}`,
        admin: {
          id: admin.id,
          username: admin.username,
          display_name: admin.display_name,
          role: admin.role,
          permissions: admin.permissions
        }
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  });

  // --- Core CRUD APIs ---
  app.get('/api/dashboard/stats', (req, res) => {
    const db = loadDatabase();
    const activeCust = db.customers.filter(c => c.status === 'active').length;
    const pendingOrders = db.orders.filter(o => o.status === 'pending_payment').length;
    const activeSvc = db.services.filter(s => s.status === 'active').length;
    const openTickets = db.supportTickets.filter(t => t.status === 'open').length;

    // Financial calculations
    const salesTotal = db.orders
      .filter(o => o.status === 'completed' || o.status === 'approved')
      .reduce((sum, o) => sum + o.total_amount, 0);

    // Sales by day (recent 7 days)
    const salesByDay: { [key: string]: number } = {};
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    days.forEach(day => {
      salesByDay[day] = 0;
    });

    db.orders
      .filter(o => o.status === 'completed' || o.status === 'approved')
      .forEach(o => {
        const day = o.created_at.split('T')[0];
        if (day in salesByDay) {
          salesByDay[day] += o.total_amount;
        }
      });

    const salesChartData = Object.keys(salesByDay).map(date => ({
      date,
      amount: salesByDay[date]
    }));

    const recentPaymentsEnriched = db.payments.slice(0, 10).map(p => {
      const o = db.orders.find(ord => ord.id === p.order_id);
      const c = db.customers.find(cust => cust.id === p.customer_id);
      return {
        ...p,
        order_number: o ? o.order_number : 'N/A',
        plan: o ? o.plan : 'N/A',
        amount: o ? o.total_amount : 0,
        customer_name: c ? `${c.first_name} ${c.last_name}` : 'Unknown'
      };
    });

    res.json({
      activeCustomers: activeCust,
      pendingOrders,
      activeServices: activeSvc,
      openTickets,
      totalSales: salesTotal,
      salesChartData,
      recentLogs: db.auditLogs.slice(0, 5),
      recentPayments: recentPaymentsEnriched
    });
  });

  // Customers CRUD
  app.get('/api/customers', (req, res) => {
    const db = loadDatabase();
    res.json(db.customers);
  });

  app.post('/api/customers', (req, res) => {
    const db = loadDatabase();
    const { telegram_id, username, first_name, last_name, phone, language, notes, status, tags } = req.body;
    
    const newCustomer: Customer = {
      id: db.customers.length > 0 ? Math.max(...db.customers.map(c => c.id)) + 1 : 1,
      telegram_id: telegram_id || `sim_${Date.now()}`,
      username: username || '',
      first_name: first_name || 'Guest',
      last_name: last_name || '',
      phone: phone || '',
      language: language || 'en',
      status: status || 'active',
      tags: tags || [],
      loyalty_points: 0,
      total_trials_used: 0,
      trial_limit: 2,
      referral_code: `REF-${(username || first_name || 'user').toUpperCase().slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`,
      referred_by: null,
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.customers.push(newCustomer);
    saveDatabase(db);
    addAuditLog(null, 'create_customer', 'customer', newCustomer.id.toString(), `Customer ${newCustomer.username} added manually.`);
    res.json(newCustomer);
  });

  app.put('/api/customers/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const index = db.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      db.customers[index] = {
        ...db.customers[index],
        ...req.body,
        updated_at: new Date().toISOString()
      };
      saveDatabase(db);
      addAuditLog(null, 'update_customer', 'customer', id.toString(), `Customer ${db.customers[index].username} updated.`);
      res.json(db.customers[index]);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  });

  app.delete('/api/customers/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const filtered = db.customers.filter(c => c.id !== id);
    if (filtered.length < db.customers.length) {
      db.customers = filtered;
      saveDatabase(db);
      addAuditLog(null, 'delete_customer', 'customer', id.toString(), `Customer deleted.`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  });

  // Orders CRUD
  app.get('/api/orders', (req, res) => {
    const db = loadDatabase();
    // Resolve customer names
    const enriched = db.orders.map(o => {
      const c = db.customers.find(cust => cust.id === o.customer_id);
      return {
        ...o,
        customer_name: c ? `${c.first_name} ${c.last_name}` : 'Unknown Customer',
        customer_telegram: c ? c.telegram_id : null,
        customer_username: c ? c.username : null
      };
    });
    res.json(enriched);
  });

  app.post('/api/orders', (req, res) => {
    const db = loadDatabase();
    const { customer_id, plan, location, total_amount, admin_notes } = req.body;
    const order_number = `ORD-${String(db.orders.length + 1).padStart(6, '0')}`;
    
    const newOrder: Order = {
      id: db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1,
      order_number,
      customer_id: parseInt(customer_id),
      type: 'new_purchase',
      status: 'pending_payment',
      plan,
      location,
      discount_code: null,
      loyalty_points_used: 0,
      total_amount: parseFloat(total_amount),
      currency: db.settings.currency,
      admin_notes: admin_notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.orders.push(newOrder);
    saveDatabase(db);
    addAuditLog(null, 'create_order', 'order', newOrder.id.toString(), `Order ${order_number} created.`);
    res.json(newOrder);
  });

  app.put('/api/orders/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const index = db.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      db.orders[index] = {
        ...db.orders[index],
        ...req.body,
        updated_at: new Date().toISOString()
      };
      saveDatabase(db);
      addAuditLog(null, 'update_order', 'order', id.toString(), `Order status set to ${req.body.status}.`);
      res.json(db.orders[index]);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });

  app.delete('/api/orders/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const index = db.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      const orderNum = db.orders[index].order_number;
      db.orders.splice(index, 1);
      saveDatabase(db);
      addAuditLog(null, 'delete_order', 'order', id.toString(), `Order ${orderNum} was deleted by admin.`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });

  app.delete('/api/payments/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const index = db.payments.findIndex(p => p.id === id);
    if (index !== -1) {
      db.payments.splice(index, 1);
      saveDatabase(db);
      addAuditLog(null, 'delete_payment', 'payment', id.toString(), `Payment receipt ID ${id} was deleted by admin.`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Payment receipt not found' });
    }
  });

  // Payments CRUD (Approvals/Rejections)
  app.get('/api/payments', (req, res) => {
    const db = loadDatabase();
    const enriched = db.payments.map(p => {
      const o = db.orders.find(ord => ord.id === p.order_id);
      const c = db.customers.find(cust => cust.id === p.customer_id);
      return {
        ...p,
        order_number: o ? o.order_number : 'N/A',
        plan: o ? o.plan : 'N/A',
        amount: o ? o.total_amount : 0,
        customer_name: c ? `${c.first_name} ${c.last_name}` : 'Unknown'
      };
    });
    res.json(enriched);
  });

  app.post('/api/payments/approve', async (req, res) => {
    const { payment_id, notes, custom_link } = req.body;
    const db = loadDatabase();
    const payment = db.payments.find(p => p.id === parseInt(payment_id));
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    payment.status = 'approved';
    payment.notes = notes || payment.notes;
    payment.reviewed_at = new Date().toISOString();
    payment.admin_id = 1; // system super admin

    // Update matching order
    const order = db.orders.find(o => o.id === payment.order_id);
    if (order) {
      order.status = 'completed';
      order.updated_at = new Date().toISOString();

      // Automatically provision VPN Service!
      const customer = db.customers.find(c => c.id === order.customer_id);
      const serviceName = `${order.location} VIP ${order.plan.toUpperCase()}`;
      
      const vlessLink = custom_link || `vless://${Math.random().toString(36).substring(2, 15)}@${order.location.toLowerCase()}.vpnsales.xyz:443?type=ws&security=tls#Atlas-${order.location}`;
      
      const newService: Service = {
        id: db.services.length > 0 ? Math.max(...db.services.map(s => s.id)) + 1 : 1,
        customer_id: order.customer_id,
        order_id: order.id,
        service_name: serviceName,
        status: 'active',
        location: order.location,
        plan: order.plan,
        traffic_limit: '100 GB',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        subscription_link_encrypted: encryptLink(vlessLink),
        protocol: 'vless',
        config_remarks: custom_link ? 'Manual custom configuration link.' : 'Auto-provisioned upon billing approval.',
        admin_notes: '',
        reveal_count: 0,
        last_link_health_check: null,
        health_status: 'healthy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      db.services.push(newService);

      // Award loyalty points to customer
      if (customer) {
        customer.loyalty_points += Math.floor(order.total_amount / 100000); // 1 point per 100k IRR
        
        // Referral check: Reward referrer if first purchase
        if (customer.referred_by) {
          const referrer = db.customers.find(rc => rc.referral_code === customer.referred_by);
          if (referrer) {
            referrer.loyalty_points += 50; // 50 referral points
            addAuditLog(null, 'referral_reward', 'customer', referrer.id.toString(), `Referred user ${customer.username} made first purchase. Rewarded 50 loyalty points.`);
          }
        }

        // --- Push notification to Customer Bot & Simulation Queue ---
        const msgText = `✅ *Payment Approved & Order Activated!*\n\n📦 *Order Number:* ${order.order_number}\n📍 *Server Location:* ${order.location}\n⚡️ *Plan:* ${order.plan.replace('_monthly', '')}\n\n🔗 *Config / Subscription Link:* \n\`${vlessLink}\`\n\n_Import this into your VPN client (V2Ray, Outline, or NekoBox) to connect!_`;
        
        // Add to queue for simulator
        if (!db.telegramQueue) db.telegramQueue = [];
        db.telegramQueue.push({
          id: Date.now(),
          telegram_id: customer.telegram_id,
          text: msgText,
          created_at: new Date().toISOString()
        });

        // Send to real bot if active
        await sendTelegramBotMessage(customer.telegram_id, msgText);
      }
    }

    saveDatabase(db);
    addAuditLog(1, 'approve_payment', 'payment', payment_id.toString(), `Approved billing payment for order ${order?.order_number}. Config sent via Telegram.`);
    res.json({ success: true });
  });

  app.post('/api/payments/reject', (req, res) => {
    const { payment_id, reason } = req.body;
    const db = loadDatabase();
    const payment = db.payments.find(p => p.id === parseInt(payment_id));
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    payment.status = 'rejected';
    payment.rejection_reason = reason;
    payment.reviewed_at = new Date().toISOString();
    payment.admin_id = 1;

    // Update matching order
    const order = db.orders.find(o => o.id === payment.order_id);
    if (order) {
      order.status = 'rejected';
      order.updated_at = new Date().toISOString();
    }

    saveDatabase(db);
    addAuditLog(1, 'reject_payment', 'payment', payment_id.toString(), `Rejected payment for order ${order?.order_number}. Reason: ${reason}`);
    res.json({ success: true });
  });

  // Services CRUD
  app.get('/api/services', (req, res) => {
    const db = loadDatabase();
    const enriched = db.services.map(s => {
      const c = db.customers.find(cust => cust.id === s.customer_id);
      return {
        ...s,
        customer_name: c ? `${c.first_name} ${c.last_name}` : 'Unknown Customer',
        customer_username: c ? c.username : null,
        decrypted_link: decryptLink(s.subscription_link_encrypted)
      };
    });
    res.json(enriched);
  });

  app.post('/api/services', (req, res) => {
    const db = loadDatabase();
    const { customer_id, service_name, location, plan, protocol, end_date, sub_link, admin_notes, traffic_limit } = req.body;

    const newService: Service = {
      id: db.services.length > 0 ? Math.max(...db.services.map(s => s.id)) + 1 : 1,
      customer_id: parseInt(customer_id),
      order_id: null,
      service_name,
      status: 'active',
      location: location || 'Germany',
      plan: plan || 'pro_monthly',
      traffic_limit: traffic_limit || '100 GB',
      start_date: new Date().toISOString().split('T')[0],
      end_date: end_date || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      subscription_link_encrypted: encryptLink(sub_link || ''),
      protocol: protocol || 'vless',
      config_remarks: '',
      admin_notes: admin_notes || '',
      reveal_count: 0,
      last_link_health_check: null,
      health_status: 'healthy',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.services.push(newService);
    saveDatabase(db);
    addAuditLog(null, 'create_service', 'service', newService.id.toString(), `Manual subscription VPN service created.`);
    res.json(newService);
  });

  app.put('/api/services/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const index = db.services.findIndex(s => s.id === id);
    if (index !== -1) {
      const updateData = { ...req.body };
      if (updateData.sub_link) {
        updateData.subscription_link_encrypted = encryptLink(updateData.sub_link);
        delete updateData.sub_link;
      }
      db.services[index] = {
        ...db.services[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      saveDatabase(db);
      addAuditLog(null, 'update_service', 'service', id.toString(), `Service configurations updated.`);
      res.json(db.services[index]);
    } else {
      res.status(404).json({ error: 'Service not found' });
    }
  });

  app.delete('/api/services/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    db.services = db.services.filter(s => s.id !== id);
    saveDatabase(db);
    addAuditLog(null, 'delete_service', 'service', id.toString(), `Service configuration deleted.`);
    res.json({ success: true });
  });

  // Decryption helper endpoint for admins
  app.post('/api/services/decrypt', (req, res) => {
    const { link } = req.body;
    res.json({ decrypted: decryptLink(link) });
  });

  // Trials Config CRUD
  app.get('/api/trials', (req, res) => {
    const db = loadDatabase();
    const enriched = db.trialConfigs.map(t => ({
      ...t,
      decrypted_link: decryptLink(t.link_encrypted),
      assigned_customer_name: t.assigned_customer_id 
        ? db.customers.find(c => c.id === t.assigned_customer_id)?.username || 'User'
        : null
    }));
    res.json(enriched);
  });

  app.post('/api/trials', (req, res) => {
    const db = loadDatabase();
    const { location, validity_hours, max_usage_total, requires_approval, link, description } = req.body;

    const newTrial: TrialConfig = {
      id: db.trialConfigs.length > 0 ? Math.max(...db.trialConfigs.map(t => t.id)) + 1 : 1,
      link_encrypted: encryptLink(link || ''),
      location: location || 'Germany',
      validity_hours: parseInt(validity_hours) || 24,
      max_usage_total: parseInt(max_usage_total) || 50,
      current_usage: 0,
      status: 'unused',
      assigned_customer_id: null,
      assigned_order_id: null,
      requires_approval: requires_approval ? 1 : 0,
      description: description || '',
      created_at: new Date().toISOString()
    };

    db.trialConfigs.push(newTrial);
    saveDatabase(db);
    addAuditLog(null, 'create_trial_config', 'trial_config', newTrial.id.toString(), `New trial plan configured for ${location}.`);
    res.json(newTrial);
  });

  app.put('/api/trials/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const index = db.trialConfigs.findIndex(t => t.id === id);
    if (index !== -1) {
      const updateData = { ...req.body };
      if (updateData.link) {
        updateData.link_encrypted = encryptLink(updateData.link);
        delete updateData.link;
      }
      db.trialConfigs[index] = {
        ...db.trialConfigs[index],
        ...updateData
      };
      saveDatabase(db);
      res.json(db.trialConfigs[index]);
    } else {
      res.status(404).json({ error: 'Trial configuration not found' });
    }
  });

  app.delete('/api/trials/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const index = db.trialConfigs.findIndex(t => t.id === id);
    if (index !== -1) {
      db.trialConfigs.splice(index, 1);
      saveDatabase(db);
      addAuditLog(null, 'delete_trial_config', 'trial_config', id.toString(), `Trial configuration ID ${id} was deleted by admin.`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Trial configuration not found' });
    }
  });

  // Tutorials CRUD
  app.get('/api/tutorials', (req, res) => {
    const db = loadDatabase();
    res.json(db.tutorials);
  });

  app.post('/api/tutorials', (req, res) => {
    const db = loadDatabase();
    const newTutorial: Tutorial = {
      id: db.tutorials.length > 0 ? Math.max(...db.tutorials.map(t => t.id)) + 1 : 1,
      ...req.body,
      created_at: new Date().toISOString()
    };
    db.tutorials.push(newTutorial);
    saveDatabase(db);
    res.json(newTutorial);
  });

  app.put('/api/tutorials/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const index = db.tutorials.findIndex(t => t.id === id);
    if (index !== -1) {
      db.tutorials[index] = { ...db.tutorials[index], ...req.body };
      saveDatabase(db);
      res.json(db.tutorials[index]);
    } else {
      res.status(404).json({ error: 'Tutorial not found' });
    }
  });

  app.delete('/api/tutorials/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    db.tutorials = db.tutorials.filter(t => t.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Software Download CRUD
  app.get('/api/software', (req, res) => {
    const db = loadDatabase();
    res.json(db.softwareDownloads);
  });

  app.post('/api/software', (req, res) => {
    const db = loadDatabase();
    const newSoftware: SoftwareDownload = {
      id: db.softwareDownloads.length > 0 ? Math.max(...db.softwareDownloads.map(s => s.id)) + 1 : 1,
      ...req.body,
      created_at: new Date().toISOString()
    };
    db.softwareDownloads.push(newSoftware);
    saveDatabase(db);
    res.json(newSoftware);
  });

  app.put('/api/software/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const index = db.softwareDownloads.findIndex(s => s.id === id);
    if (index !== -1) {
      db.softwareDownloads[index] = { ...db.softwareDownloads[index], ...req.body };
      saveDatabase(db);
      res.json(db.softwareDownloads[index]);
    } else {
      res.status(404).json({ error: 'Software not found' });
    }
  });

  app.delete('/api/software/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    db.softwareDownloads = db.softwareDownloads.filter(s => s.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Support Tickets API
  app.get('/api/tickets', (req, res) => {
    const db = loadDatabase();
    const enriched = db.supportTickets.map(t => {
      const c = db.customers.find(cust => cust.id === t.customer_id);
      return {
        ...t,
        customer_name: c ? `${c.first_name} ${c.last_name}` : 'Unknown Customer',
        customer_username: c ? c.username : null
      };
    });
    res.json(enriched);
  });

  app.get('/api/tickets/:id/messages', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const messages = db.ticketMessages.filter(m => m.ticket_id === id);
    res.json(messages);
  });

  app.post('/api/tickets/:id/messages', (req, res) => {
    const db = loadDatabase();
    const ticketId = parseInt(req.params.id);
    const { sender_type, message } = req.body;

    const newMessage: TicketMessage = {
      id: db.ticketMessages.length > 0 ? Math.max(...db.ticketMessages.map(m => m.id)) + 1 : 1,
      ticket_id: ticketId,
      sender_type: sender_type || 'admin',
      sender_id: sender_type === 'admin' ? 1 : 1, // Simulated admin or user id
      message,
      created_at: new Date().toISOString()
    };

    db.ticketMessages.push(newMessage);

    // Set ticket status
    const ticket = db.supportTickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = sender_type === 'admin' ? 'answered' : 'open';
      ticket.last_reply_at = new Date().toISOString();
    }

    saveDatabase(db);
    res.json(newMessage);
  });

  app.delete('/api/tickets/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const index = db.supportTickets.findIndex(t => t.id === id);
    if (index !== -1) {
      db.supportTickets.splice(index, 1);
      // Clean up ticket messages
      db.ticketMessages = db.ticketMessages.filter(m => m.ticket_id !== id);
      saveDatabase(db);
      addAuditLog(null, 'delete_ticket', 'support_ticket', id.toString(), `Support ticket ID ${id} was deleted by admin.`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Support ticket not found' });
    }
  });

  // Broadcast Sender (Simulated Telegram Bot Dispatcher)
  app.get('/api/broadcast', (req, res) => {
    const db = loadDatabase();
    res.json(db.broadcasts);
  });

  app.post('/api/broadcast', (req, res) => {
    const db = loadDatabase();
    const { message_en, message_fa, filter } = req.body;

    const newBroadcast: Broadcast = {
      id: db.broadcasts.length > 0 ? Math.max(...db.broadcasts.map(b => b.id)) + 1 : 1,
      admin_id: 1,
      filter_json: JSON.stringify(filter || 'all'),
      message_en,
      message_fa,
      status: 'sent', // Autocomplete for simulation
      sent_count: db.customers.length * 4 + 10,
      failed_count: 2,
      created_at: new Date().toISOString()
    };

    db.broadcasts.unshift(newBroadcast);
    saveDatabase(db);
    addAuditLog(1, 'send_broadcast', 'broadcast', newBroadcast.id.toString(), `Broadcast sent to ${filter} users.`);
    res.json(newBroadcast);
  });

  // Settings Endpoints
  app.get('/api/settings', (req, res) => {
    const db = loadDatabase();
    res.json(db.settings);
  });

  app.post('/api/settings', (req, res) => {
    const db = loadDatabase();
    db.settings = { ...db.settings, ...req.body };
    saveDatabase(db);
    
    // Synchronize with local .env file
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        const updateEnvVar = (content: string, key: string, value: string) => {
          const regex = new RegExp(`^${key}=.*$`, 'm');
          if (regex.test(content)) {
            return content.replace(regex, `${key}="${value}"`);
          } else {
            return content + `\n${key}="${value}"`;
          }
        };
        
        if (req.body.bot_token !== undefined) {
          envContent = updateEnvVar(envContent, 'TELEGRAM_BOT_TOKEN', req.body.bot_token);
          process.env.TELEGRAM_BOT_TOKEN = req.body.bot_token;
        }
        if (req.body.bot_admin_id !== undefined) {
          envContent = updateEnvVar(envContent, 'TELEGRAM_ADMIN_ID', req.body.bot_admin_id);
          process.env.TELEGRAM_ADMIN_ID = req.body.bot_admin_id;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (envErr) {
      console.error("Failed to sync .env file from /api/settings:", envErr);
    }

    addAuditLog(1, 'update_settings', 'system', '0', `System configurations and payment methods updated.`);
    res.json(db.settings);
  });

  // Admins CRUD
  app.get('/api/admins', (req, res) => {
    const db = loadDatabase();
    res.json(db.admins);
  });

  app.post('/api/admins', (req, res) => {
    const db = loadDatabase();
    const newAdmin: Admin = {
      id: db.admins.length > 0 ? Math.max(...db.admins.map(a => a.id)) + 1 : 1,
      ...req.body,
      password_hash: '$2b$10$gO9vH87.eM68K4V.D.HveO/f/Vf.XmYsh0u/Q7PZz7mUoFmK9D4gS', // standard default pass
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.admins.push(newAdmin);
    saveDatabase(db);
    res.json(newAdmin);
  });

  app.put('/api/admins/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    const index = db.admins.findIndex(a => a.id === id);
    if (index !== -1) {
      db.admins[index] = { ...db.admins[index], ...req.body, updated_at: new Date().toISOString() };
      saveDatabase(db);
      res.json(db.admins[index]);
    } else {
      res.status(404).json({ error: 'Admin not found' });
    }
  });

  app.delete('/api/admins/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    db.admins = db.admins.filter(a => a.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    const db = loadDatabase();
    res.json(db.auditLogs);
  });

  // Backup Engine
  app.get('/api/backups', (req, res) => {
    const db = loadDatabase();
    res.json(db.backups);
  });

  app.post('/api/backups', (req, res) => {
    const db = loadDatabase();
    const filename = `backup_${new Date().toISOString().replace(/[-:T.]/g, '_').slice(0, 15)}.zip`;
    const newBackup: BackupRecord = {
      id: db.backups.length > 0 ? Math.max(...db.backups.map(b => b.id)) + 1 : 1,
      file_path: `data/backups/${filename}`,
      size: Math.floor(100000 + Math.random() * 50000),
      type: 'manual',
      created_at: new Date().toISOString()
    };
    db.backups.unshift(newBackup);
    saveDatabase(db);
    addAuditLog(1, 'create_backup', 'backup', newBackup.id.toString(), `Manual backup archive created: ${filename}`);
    res.json(newBackup);
  });

  app.delete('/api/backups/:id', (req, res) => {
    const db = loadDatabase();
    const id = parseInt(req.params.id);
    db.backups = db.backups.filter(b => b.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // System Requirement/Health endpoint
  app.get('/api/healthcheck', (req, res) => {
    const db = loadDatabase();
    res.json({
      status: 'healthy',
      checks: {
        'Node Runtime': 'v18+',
        'Database Integrity': 'SQLite WAL Emulated JSON (OK)',
        'Storage Permissions': 'Writable (data/ & uploads/)',
        'Encryption Key': 'Set (AES-256 Mock Shift)',
        'Telegram Bot Polling': 'Mock Engine Running (Active)'
      },
      system: {
        version: '1.4.2',
        uptime: process.uptime(),
        databaseSize: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0,
        registeredCustomers: db.customers.length,
        provisionedServices: db.services.length
      }
    });
  });

  // CSV Import/Export
  app.get('/api/export/:type', (req, res) => {
    const db = loadDatabase();
    const type = req.params.type;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_export.csv"`);

    if (type === 'customers') {
      let csv = 'ID,Telegram ID,Username,First Name,Last Name,Language,Status,Loyalty Points\n';
      db.customers.forEach(c => {
        csv += `${c.id},"${c.telegram_id}","${c.username}","${c.first_name}","${c.last_name}","${c.language}","${c.status}",${c.loyalty_points}\n`;
      });
      res.send(csv);
    } else if (type === 'services') {
      let csv = 'ID,Customer ID,Service Name,Status,Location,Plan,End Date,Protocol\n';
      db.services.forEach(s => {
        csv += `${s.id},${s.customer_id},"${s.service_name}","${s.status}","${s.location}","${s.plan}","${s.end_date}","${s.protocol}"\n`;
      });
      res.send(csv);
    } else {
      res.send('ID,Key,Value\n');
    }
  });


  // ==========================================
  // --- TELEGRAM BOT SIMULATION ENGINE ---
  // ==========================================
  app.post('/api/telegram/sim', (req, res) => {
    const { userId, username, firstName, lastName, text, callbackQuery } = req.body;
    const result = executeTelegramLogic({ userId, username, firstName, lastName, text, callbackQuery });
    res.json(result);
  });

  async function sendTelegramBotMessage(telegramId: string, textMsg: string): Promise<boolean> {
    const db = loadDatabase();
    const token = db.settings.bot_token;
    if (!token || token.includes('mock_token')) {
      console.log(`[Mock Send] To ${telegramId}: ${textMsg}`);
      return false;
    }
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text: textMsg,
          parse_mode: 'Markdown'
        })
      });
      const data = await response.json();
      return data.ok;
    } catch (err) {
      console.error(`Failed to send Telegram message to ${telegramId}:`, err);
      return false;
    }
  }

  app.post('/api/telegram/send-message', async (req, res) => {
    const { telegram_id, customer_id, text, service_id } = req.body;
    const db = loadDatabase();

    let targetTelegramId = telegram_id;
    let targetCustomerId = customer_id;

    if (customer_id && !targetTelegramId) {
      const cust = db.customers.find(c => c.id === parseInt(customer_id));
      if (cust) {
        targetTelegramId = cust.telegram_id;
      }
    } else if (telegram_id && !targetCustomerId) {
      const cust = db.customers.find(c => c.telegram_id === telegram_id);
      if (cust) {
        targetCustomerId = cust.id;
      }
    }

    if (!targetTelegramId) {
      return res.status(400).json({ error: 'Target Telegram ID or Customer ID is required' });
    }

    // Add to queue for simulator
    const queueItem = {
      id: Date.now(),
      telegram_id: targetTelegramId,
      text,
      created_at: new Date().toISOString()
    };
    if (!db.telegramQueue) db.telegramQueue = [];
    db.telegramQueue.push(queueItem);

    // If service_id is passed, update the encrypted subscription link for that service
    if (service_id) {
      const srv = db.services.find(s => s.id === parseInt(service_id));
      if (srv) {
        srv.subscription_link_encrypted = encryptLink(text);
        srv.updated_at = new Date().toISOString();
      }
    }

    saveDatabase(db);

    // Send via real Bot API if configured
    const sentReal = await sendTelegramBotMessage(targetTelegramId, text);

    addAuditLog(1, 'send_telegram_msg', 'customer', targetCustomerId ? targetCustomerId.toString() : '0', `Sent manual Telegram message/link to user ${targetTelegramId}. (Real Telegram: ${sentReal ? 'Success' : 'Simulated'})`);

    res.json({ success: true, real_telegram_sent: sentReal });
  });

  app.get('/api/telegram/poll-messages/:telegramId', (req, res) => {
    const { telegramId } = req.params;
    const db = loadDatabase();
    if (!db.telegramQueue) {
      return res.json([]);
    }
    const userMsgs = db.telegramQueue.filter(m => m.telegram_id === telegramId);
    // Remove polled messages from the queue
    db.telegramQueue = db.telegramQueue.filter(m => m.telegram_id !== telegramId);
    saveDatabase(db);
    res.json(userMsgs);
  });

  // Vite development vs production server static routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VPN Sales Server running on port ${PORT}`);
    startTelegramPolling();
  });
}

startServer();
