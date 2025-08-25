#!/bin/bash

echo "_____ _______   **_**__  ________    **  "
echo "/ **__| ** \ \ / / | ** \| ____\ \ / / "
echo "| | **| |**) \ \ / / | | | | |__ \ \ / /  "
echo "| | |_ | ___/ \ \/ / | | | | **| \ \/ /   "
echo "| |**| | | \ / | |__| | |____ \ /     "
echo "\_____|_| \/ |_____/|______| \/      "
echo ""
echo "[GPV-DEV] Backend Startup Script Initiated"
echo "=========================================="
echo ""

log_message() {
    echo "[GPV-DEV] $1"
}

handle_error() {
    log_message "ERROR: $1"
    exit 1
}

log_message "Checking current working directory..."
CURRENT_DIR=$(pwd)
log_message "Current directory: $CURRENT_DIR"

# Check for package.jso
if [ ! -f "package.json" ]; then
    handle_error "package.json not found. Please ensure you're in the backend directory."
fi

log_message "package.json found!"

# Check for index.js 
if [ ! -f "index.js" ]; then
    handle_error "index.js not found. Please ensure you're in the correct backend directory."
fi

log_message "index.js found - backend entry point detected"

if grep -q "express\|fastify\|koa\|prisma\|mongoose\|sequelize" package.json 2>/dev/null; then
    log_message "Backend framework/ORM detected in package.json"
else
    log_message "WARNING: No obvious backend framework detected, but proceeding..."
fi

# Step 1: npm install
log_message "Starting npm install..."
if npm install; then
    log_message "npm install completed successfully"
else
    handle_error "npm install failed"
fi

# Wait a moment for npm install to fully complete
log_message "Waiting for npm install to fully complete..."
sleep 4

# Step 2: npx prisma generate
log_message "Running Prisma generate..."
if npx prisma generate; then
    log_message "Prisma generate completed successfully"
else
    handle_error "Prisma generate failed"
fi

# Step 3: Start with PM2
log_message "Starting backend with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    handle_error "PM2 is not installed. Please install it with: npm install -g pm2"
fi

# Stop existing PM2 process if it exists (assuming backend process name)
log_message "Stopping any existing backend PM2 process..."
sudo pm2 delete backend 2>/dev/null || log_message "No existing 'backend' process found"
sudo pm2 delete index 2>/dev/null || log_message "No existing 'index' process found"

# Start the backend with PM2
log_message "Starting new PM2 process for backend..."
if sudo pm2 start index.js --name "backend"; then
    log_message "PM2 process 'backend' started successfully"
else
    handle_error "Failed to start PM2 process for backend"
fi

log_message "Current PM2 status:"
sudo pm2 list

log_message "Saving PM2 configuration..."
sudo pm2 save

log_message "=========================================="
log_message "Backend deployment completed successfully!"
log_message "Backend application is now running via PM2"
log_message "Use 'sudo pm2 logs backend' to view logs"
log_message "Use 'sudo pm2 restart backend' to restart"
log_message "Use 'sudo pm2 stop backend' to stop"
log_message "=========================================="