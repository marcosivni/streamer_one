#!/bin/bash

# Deployment script for StreamerData One (Self-Contained Mode)
echo "🚀 Starting Full Containerized Deployment..."

# Navigate to the deployment directory
cd "$(dirname "$0")"

# Clean up any existing instances and volumes to ensure a fresh data load
echo "🧹 Performing deep cleanup..."
docker compose -p streamerdata down -v --remove-orphans 2>/dev/null
# Extra precaution: kill any volumes from this project just in case
docker volume ls -q | grep "streamerdata_db_data" | xargs -r docker volume rm 2>/dev/null

# Build and start the containers
echo "📦 Building images and initializing database..."
echo "⚠️  This will take a moment while the SQL dump is imported and views are refreshed."
docker compose -p streamerdata up -d --build --force-recreate

echo "⏳ Waiting for system to be ready..."
# Simple wait loop for the frontend to be available
until $(curl --output /dev/null --silent --head --fail http://localhost:5174); do
    printf '.'
    sleep 2
done

echo ""
echo "✅ System is fully deployed and connected!"
echo "📡 Frontend: http://localhost:5174"
echo "📡 Backend API: http://localhost:8001/api/"
echo "🗄️  Database: PostgreSQL 15 (Containerized)"
echo ""
echo "📝 To monitor logs in real-time, use: ./logs.sh"
