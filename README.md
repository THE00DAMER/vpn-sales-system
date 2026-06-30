# Atlas VPN - Telegram Bot & Admin Dashboard

A full-stack solution for managing VPN subscriptions, customers, and support tickets via a Telegram Bot, coupled with a comprehensive React-based Admin Dashboard.

## 🌟 Features

- **Telegram Bot Integration:** Fully functional Telegram bot for users to purchase subscriptions, view services, request free trials, and contact support.
- **Admin Dashboard:** Modern, responsive React dashboard built with Tailwind CSS and Lucide Icons.
- **Customer Management:** Track users, loyalty points, referrals, and subscription limits.
- **Order & Payment Tracking:** Manage customer orders and verify payments.
- **Software & Tutorials Management:** Provide dynamic software download links and setup tutorials directly through the bot.
- **Support Ticket System:** Built-in ticketing system for user support.
- **System Backups:** Local SQLite/JSON database backup and restore functionality.

## 🚀 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express, TypeScript
- **Database:** Local JSON File Storage (Easily migratable to SQLite/PostgreSQL)

## ⚡ Quick Installation (Recommended)

We provide an automated installation script that handles dependencies, environment setup, and bot configuration.

```bash
git clone https://github.com/yourusername/atlas-vpn.git
cd atlas-vpn
chmod +x install.sh
./install.sh
```

## 🛠️ Manual Installation Guide

Follow these steps to set up the project on your local machine or server.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A Telegram Bot Token (Get it from [@BotFather](https://t.me/BotFather))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/atlas-vpn.git
cd atlas-vpn
```

### 2. Install Dependencies

Install the required npm packages:

```bash
npm install
```

*Note: If you encounter an error related to `@tailwindcss/oxide` or optional dependencies on your server, remove `node_modules` and `package-lock.json` and try again:*
```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory based on `.env.example` (if available) or add the following variables:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_ADMIN_ID=your_personal_telegram_user_id
```

### 4. Running in Development Mode

To start the development server with Hot Module Replacement (HMR) and the backend API proxy:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 5. Building for Production

To build the React frontend and compile the backend TypeScript code into a standalone bundle:

```bash
npm run build
```

After building, start the production server:

```bash
npm start
```

## 🔧 Troubleshooting

### Tailwind CSS Native Binding Error (`@tailwindcss/oxide`)
If you encounter the following error during installation or build:
```
Error: Cannot find native binding. npm has a bug related to optional dependencies...
```
This is a known `npm` bug on some servers. To fix it, run the following commands:

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Bot Configuration

Once the dashboard is running, you can access the **Bot Config** section in the Admin Panel to set:
- Welcome and Help messages (English & Farsi).
- Private Video Tutorial Group links.
- Payment methods.

## 📲 Software & Tutorials

You can dynamically add VPN clients (like v2rayNG, NapsternetV) and text-based setup tutorials from the Admin Dashboard. These will instantly reflect in the Telegram bot under the "Download Software" and "Setup Tutorials" menus.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/atlas-vpn/issues).

## 📝 License

This project is licensed under the MIT License.
