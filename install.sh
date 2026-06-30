#!/bin/bash

# VPN Panel Automated Installation Script
# This script sets up the environment, installs dependencies, and starts the application.

set -e

echo "===================================================="
echo "🚀 Starting VPN Panel Setup & Installation..."
echo "===================================================="

# 1. Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18 or higher)."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js is installed (Version: $(node -v))."

# 2. Check npm installation
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi
echo "✅ npm is installed (Version: $(npm -v))."

# 3. Create necessary directories
echo "📁 Setting up data directories..."
mkdir -p data
if [ ! -f data/db.json ]; then
    echo "{}" > data/db.json
    echo "✅ Created empty database file (data/db.json)."
else
    echo "✅ Database file already exists."
fi

# 4. Install Dependencies
echo "📦 Installing npm dependencies..."
npm install

# 5. Build the application (TypeScript / Vite)
echo "🏗️ Building the application..."
npm run build

# 6. Setup Environment Variables
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Copied .env.example to .env."
    else
        echo "PORT=3000" > .env
        echo "NODE_ENV=production" >> .env
        echo "TELEGRAM_BOT_TOKEN=" >> .env
        echo "TELEGRAM_ADMIN_ID=" >> .env
        echo "✅ Created a default .env file."
    fi
else
    echo "✅ .env file already exists."
fi

echo "===================================================="
echo "🤖 Telegram Bot Configuration"
echo "===================================================="
read -p "Enter your Telegram Bot Token (leave blank to skip): " BOT_TOKEN
if [ ! -z "$BOT_TOKEN" ]; then
    # Replace or append TELEGRAM_BOT_TOKEN
    if grep -q "^TELEGRAM_BOT_TOKEN=" .env; then
        sed -i "s|^TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=\"$BOT_TOKEN\"|" .env
    else
        echo "TELEGRAM_BOT_TOKEN=\"$BOT_TOKEN\"" >> .env
    fi
    echo "✅ Bot Token saved to .env"
fi

read -p "Enter your Telegram Admin ID (leave blank to skip): " ADMIN_ID
if [ ! -z "$ADMIN_ID" ]; then
    # Replace or append TELEGRAM_ADMIN_ID
    if grep -q "^TELEGRAM_ADMIN_ID=" .env; then
        sed -i "s|^TELEGRAM_ADMIN_ID=.*|TELEGRAM_ADMIN_ID=\"$ADMIN_ID\"|" .env
    else
        echo "TELEGRAM_ADMIN_ID=\"$ADMIN_ID\"" >> .env
    fi
    echo "✅ Admin ID saved to .env"
fi

echo "===================================================="
echo "🎉 Installation Complete!"
echo "===================================================="
echo "To start the application in development mode, run:"
echo "  npm run dev"
echo ""
echo "To start the application in production mode, run:"
echo "  npm run start"
echo "===================================================="
