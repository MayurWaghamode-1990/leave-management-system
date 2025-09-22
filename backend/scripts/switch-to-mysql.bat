@echo off
echo 🔄 Switching to MySQL configuration...

echo Copying MySQL schema...
copy "prisma\schema.prisma" "prisma\schema.mysql.prisma"
copy "prisma\schema.prisma" "prisma\schema.prisma"

echo Copying MySQL environment...
copy ".env.mysql" ".env"

echo ✅ Switched to MySQL!
echo 📋 Next steps:
echo   1. Ensure MySQL is running
echo   2. Run: npx prisma generate
echo   3. Run: npx prisma db push
echo   4. Run: npx prisma db seed
echo   5. Run: npm run dev

pause