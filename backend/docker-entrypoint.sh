#!/bin/sh
set -e

echo "Starting Leave Management System Backend..."

# Wait for database to be ready
echo "Waiting for MySQL to be ready..."
until node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: process.env.DATABASE_URL?.match(/mysql:\/\/.*?:(.*?)@(.*?):(.*?)\//)?.[2] || 'mysql',
  port: process.env.DATABASE_URL?.match(/mysql:\/\/.*?:(.*?)@(.*?):(.*?)\//)?.[3] || 3306,
  user: process.env.DATABASE_URL?.match(/mysql:\/\/.*?:(.*?)@/)?.[1] || 'lms_user',
  password: process.env.DATABASE_URL?.match(/mysql:\/\/(.*?):(.*?)@/)?.[2] || 'password123'
}).then(conn => {
  console.log('MySQL is ready!');
  conn.end();
}).catch(err => {
  console.log('Waiting for MySQL...', err.message);
  process.exit(1);
});
" 2>/dev/null; do
  echo "MySQL is unavailable - sleeping"
  sleep 2
done

echo "MySQL is ready!"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed database if needed (only in development)
if [ "$NODE_ENV" != "production" ]; then
  echo "Seeding database..."
  npm run db:seed 2>/dev/null || echo "Database seeding skipped"
fi

echo "Starting application..."
exec "$@"