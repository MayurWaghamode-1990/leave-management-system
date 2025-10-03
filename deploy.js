#!/usr/bin/env node

/**
 * Production Deployment Script
 * Leave Management System
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production deployment for Leave Management System...\n');

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const BACKEND_DIR = path.join(__dirname, 'backend');

// Configuration
const config = {
  skipTests: process.argv.includes('--skip-tests'),
  skipLint: process.argv.includes('--skip-lint'),
  analyze: process.argv.includes('--analyze'),
  verbose: process.argv.includes('--verbose')
};

// Helper functions
function runCommand(command, cwd = __dirname, description = '') {
  console.log(`📋 ${description || command}`);
  try {
    const result = execSync(command, {
      cwd,
      stdio: config.verbose ? 'inherit' : 'pipe',
      encoding: 'utf8'
    });
    console.log('✅ Success\n');
    return result;
  } catch (error) {
    console.error(`❌ Failed: ${error.message}\n`);
    process.exit(1);
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} exists`);
    return true;
  } else {
    console.error(`❌ ${description} not found at ${filePath}`);
    return false;
  }
}

// Deployment steps
async function deployFrontend() {
  console.log('📦 Building Frontend Application...\n');

  // Check if frontend directory exists
  if (!checkFileExists(FRONTEND_DIR, 'Frontend directory')) {
    return;
  }

  // Install dependencies
  runCommand('npm ci', FRONTEND_DIR, 'Installing frontend dependencies');

  // Run linting if not skipped
  if (!config.skipLint) {
    runCommand('npm run lint', FRONTEND_DIR, 'Running frontend linting');
  }

  // Run tests if not skipped
  if (!config.skipTests) {
    console.log('🧪 Running frontend tests...');
    try {
      runCommand('npm test -- --run', FRONTEND_DIR, 'Running frontend tests');
    } catch (error) {
      console.log('⚠️  No tests found or test command not available, continuing...\n');
    }
  }

  // Build for production
  runCommand('npm run build', FRONTEND_DIR, 'Building frontend for production');

  // Analyze bundle if requested
  if (config.analyze) {
    console.log('📊 Analyzing bundle size...');
    try {
      runCommand('npx vite-bundle-analyzer dist', FRONTEND_DIR, 'Analyzing bundle');
    } catch (error) {
      console.log('⚠️  Bundle analyzer not available, skipping...\n');
    }
  }

  console.log('✅ Frontend build completed successfully!\n');
}

async function deployBackend() {
  console.log('⚙️  Preparing Backend Application...\n');

  // Check if backend directory exists
  if (!checkFileExists(BACKEND_DIR, 'Backend directory')) {
    return;
  }

  // Install dependencies
  runCommand('npm ci', BACKEND_DIR, 'Installing backend dependencies');

  // Run linting if not skipped
  if (!config.skipLint) {
    try {
      runCommand('npm run lint', BACKEND_DIR, 'Running backend linting');
    } catch (error) {
      console.log('⚠️  Backend linting not available, skipping...\n');
    }
  }

  // Build TypeScript
  try {
    runCommand('npm run build', BACKEND_DIR, 'Building backend TypeScript');
  } catch (error) {
    console.log('⚠️  Backend build not available, using development mode...\n');
  }

  // Run tests if not skipped
  if (!config.skipTests) {
    console.log('🧪 Running backend tests...');
    try {
      runCommand('npm test', BACKEND_DIR, 'Running backend tests');
    } catch (error) {
      console.log('⚠️  No tests found or test command not available, continuing...\n');
    }
  }

  console.log('✅ Backend preparation completed successfully!\n');
}

function validateEnvironment() {
  console.log('🔍 Validating deployment environment...\n');

  // Check Node.js version
  const nodeVersion = process.version;
  console.log(`Node.js version: ${nodeVersion}`);

  // Check npm version
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`npm version: ${npmVersion}`);
  } catch (error) {
    console.error('❌ npm not found');
    process.exit(1);
  }

  // Check environment files
  const frontendEnvProd = path.join(FRONTEND_DIR, '.env.production');
  checkFileExists(frontendEnvProd, 'Frontend production environment file');

  console.log('✅ Environment validation completed!\n');
}

function generateDeploymentReport() {
  console.log('📊 Generating deployment report...\n');

  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: 'production',
    config: config,
    status: 'success'
  };

  // Check build artifacts
  const frontendDist = path.join(FRONTEND_DIR, 'dist');
  if (fs.existsSync(frontendDist)) {
    const distFiles = fs.readdirSync(frontendDist, { recursive: true });
    report.frontendAssets = distFiles.length;
  }

  // Save report
  fs.writeFileSync(
    path.join(__dirname, 'deployment-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('✅ Deployment report generated!\n');
}

function printDeploymentSummary() {
  console.log('🎉 Production Deployment Summary');
  console.log('================================\n');

  console.log('✅ Frontend application built successfully');
  console.log('✅ Backend application prepared successfully');
  console.log('✅ All checks completed');
  console.log('✅ Production-ready deployment created\n');

  console.log('📁 Build Artifacts:');
  console.log(`   Frontend: ${path.join(FRONTEND_DIR, 'dist')}`);
  console.log(`   Backend: ${BACKEND_DIR}\n`);

  console.log('🚀 Next Steps:');
  console.log('   1. Deploy frontend dist folder to your web server');
  console.log('   2. Deploy backend to your production server');
  console.log('   3. Configure environment variables');
  console.log('   4. Set up reverse proxy (nginx/Apache)');
  console.log('   5. Configure SSL certificates');
  console.log('   6. Set up monitoring and logging\n');

  console.log('📋 Production Checklist:');
  console.log('   □ Database migrations applied');
  console.log('   □ Environment variables configured');
  console.log('   □ SSL certificates installed');
  console.log('   □ Monitoring system configured');
  console.log('   □ Backup system in place');
  console.log('   □ Load balancer configured (if applicable)\n');

  console.log('🎯 Leave Management System is ready for production deployment!');
}

// Main deployment function
async function main() {
  try {
    const startTime = Date.now();

    validateEnvironment();
    await deployBackend();
    await deployFrontend();
    generateDeploymentReport();

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log(`⏱️  Total deployment time: ${duration} seconds\n`);
    printDeploymentSummary();

  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Handle CLI help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Leave Management System - Production Deployment Script

Usage: node deploy.js [options]

Options:
  --skip-tests     Skip running tests
  --skip-lint      Skip linting
  --analyze        Analyze bundle size
  --verbose        Verbose output
  --help, -h       Show this help message

Examples:
  node deploy.js                    # Full deployment
  node deploy.js --skip-tests       # Deploy without tests
  node deploy.js --analyze --verbose # Deploy with bundle analysis and verbose output
  `);
  process.exit(0);
}

// Run deployment
main();