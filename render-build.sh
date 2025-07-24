#!/usr/bin/env bash

# Puppeteer Chromium dependencies
apt-get update
apt-get install -y \
  libatk1.0-0 \
  libnss3 \
  libxss1 \
  libasound2 \
  libxshmfence1 \
  libgbm1 \
  libgtk-3-0 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libpangocairo-1.0-0 \
  libpangoft2-1.0-0 \
  libcairo2 \
  fonts-liberation \
  libdrm2 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdbus-1-3

# Then build the app
npm install
npm run build

