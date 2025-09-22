@echo off
echo 🔄 Switching to SQLite configuration...

echo Copying SQLite schema...
copy "prisma\schema.sqlite.prisma" "prisma\schema.prisma"

echo Copying SQLite environment...
copy ".env.sqlite" ".env"

echo ✅ Switched to SQLite!
echo 📋 Next steps:
echo   1. Run: npx prisma generate
echo   2. Run: npx prisma db push
echo   3. Run: npx prisma db seed
echo   4. Run: npm run dev

pause