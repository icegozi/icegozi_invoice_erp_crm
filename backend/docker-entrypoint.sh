#!/bin/sh
set -e

echo "⏳ Waiting for MongoDB at $DATABASE ..."
until node -e "const m=require('mongoose');m.connect(process.env.DATABASE).then(()=>process.exit(0)).catch(()=>process.exit(1));" 2>/dev/null; do
  sleep 2
done
echo "✅ MongoDB is ready."

# Seed admin + default settings only if the database is empty (idempotent across restarts)
NEEDS_SETUP=$(node -e "const m=require('mongoose');m.connect(process.env.DATABASE).then(async()=>{try{const c=await m.connection.collection('admins').countDocuments();console.log(c===0?'yes':'no');}catch(e){console.log('yes');}process.exit(0);}).catch(()=>{console.log('yes');process.exit(0);});")

if [ "$NEEDS_SETUP" = "yes" ]; then
  echo "🌱 Empty database detected — running setup (seeding admin & default settings)..."
  npm run setup
  echo "👍 Setup done. Default login → admin@admin.com / admin123"
else
  echo "ℹ️  Database already initialized — skipping setup."
fi

exec "$@"
