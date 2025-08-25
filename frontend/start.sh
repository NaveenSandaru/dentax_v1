#!/bin/bash

echo "_____ _______   **_**__  ________    **  "
echo "/ **__| ** \ \ / / | ** \| ____\ \ / / "
echo "| | **| |**) \ \ / / | | | | |__ \ \ / /  "
echo "| | |_ | ___/ \ \/ / | | | | **| \ \/ /   "
echo "| |**| | | \ / | |__| | |____ \ /     "
echo "\_____|_| \/ |_____/|______| \/      "
echo ""
echo "[GPV-DEV] Frontend Startup Script Initiated"
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

# Check for package.json
if [ ! -f "package.json" ]; then
    handle_error "package.json not found. Please ensure you're in the frontend directory."
fi

log_message "package.json found!"

if grep -q "react\|vue\|angular\|next\|nuxt" package.json 2>/dev/null; then
    log_message "Frontend framework detected in package.json"
else
    log_message "WARNING: No obvious frontend framework detected, but proceeding..."
fi

# Step 1: npm install
log_message "Starting npm install..."
if npm install; then
    log_message "npm install completed successfully"
else
    handle_error "npm install failed"
fi

log_message "Waiting for npm install to fully complete..."
sleep 4

# Step 2: npm run build
log_message "Starting build process..."
if npm run build; then
    log_message "Build completed successfully"
else
    handle_error "Build process failed"
fi

# Step 3: Start with PM2
log_message "Starting application with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    handle_error "PM2 is not installed. Please install it with: npm install -g pm2"
fi

# Stop existing PM2 process if it exists
log_message "Stopping any existing 'kinross' PM2 process..."
sudo pm2 delete kinross 2>/dev/null || log_message "No existing 'kinross' process found"

# Start the application with PM2
log_message "Starting new PM2 process..."
if sudo pm2 start npm --name "kinross" -- run start; then
    log_message "PM2 process 'kinross' started successfully"
else
    handle_error "Failed to start PM2 process"
fi

log_message "Current PM2 status:"
sudo pm2 list

log_message "Saving PM2 configuration..."
sudo pm2 save

log_message "=========================================="
log_message "Frontend deployment completed successfully!"
log_message "Application 'kinross' is now running via PM2"
log_message "Use 'sudo pm2 logs kinross' to view logs"
log_message "Use 'sudo pm2 restart kinross' to restart"
log_message "Use 'sudo pm2 stop kinross' to stop"
log_message "=========================================="