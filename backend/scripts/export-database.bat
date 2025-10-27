@echo off
REM Database Export Script for Leave Management System
REM This script exports the MySQL database to a SQL file

echo Exporting Leave Management System Database...

set MYSQL_BIN="C:\Program Files\MySQL\MySQL Server 9.1\bin\mysqldump.exe"
set DB_USER=root
set DB_PASS=Mayur@123
set DB_NAME=leave_management_system
set BACKUP_DIR=database-backups
set BACKUP_FILE=%BACKUP_DIR%\leave_management_system_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql

REM Create backup directory if it doesn't exist
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

REM Export database
%MYSQL_BIN% -u %DB_USER% -p%DB_PASS% %DB_NAME% > %BACKUP_FILE% 2>&1

if %ERRORLEVEL% EQU 0 (
    echo Database exported successfully to %BACKUP_FILE%
) else (
    echo Error exporting database
)

pause
