-- Leave Management System - Database Setup Script
-- Run this script with MySQL root user to set up the database

-- Drop existing database and user if they exist (for clean setup)
DROP DATABASE IF EXISTS leave_management_db;
DROP USER IF EXISTS 'lms_user'@'localhost';

-- Create database
CREATE DATABASE leave_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user with password
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'password123';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON leave_management_db.* TO 'lms_user'@'localhost';

-- Apply privilege changes
FLUSH PRIVILEGES;

-- Verify the setup
SELECT 'Database created successfully!' AS status;
SHOW DATABASES LIKE 'leave_management_db';
SELECT User, Host FROM mysql.user WHERE User = 'lms_user';
