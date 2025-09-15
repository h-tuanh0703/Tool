FROM node:18-bullseye

# Install GUI dependencies
RUN apt-get update && apt-get install -y \
    xvfb \
    x11vnc \
    fluxbox \
    wget \
    wmctrl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# Set display for GUI
ENV DISPLAY=:99

EXPOSE 3000

# Start Xvfb and the app
CMD ["sh", "-c", "Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 & npm start"]