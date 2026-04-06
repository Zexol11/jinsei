#!/bin/bash
set -e

echo "🚀 Starting jinsei API..."

echo "▶ Caching config..."
php artisan config:cache

echo "▶ Caching routes..."
php artisan route:cache

echo "▶ Running migrations..."
php artisan migrate --force

echo "✅ Starting server on port ${PORT:-8000}..."
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
