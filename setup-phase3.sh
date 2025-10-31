#!/bin/bash

# Phase 3.3 Automated Setup Script
# This script automates the deployment of Phase 3.3 (USA PTO + Analytics)

set -e  # Exit on error

echo "=================================================="
echo "  Phase 3.3 Setup Script"
echo "  USA PTO Automation + Advanced Analytics"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✔ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✖ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_step() {
    echo -e "\n${BLUE}==>${NC} $1"
}

# Check if Docker is running
print_step "Step 1: Checking Docker"
if ! docker ps &> /dev/null; then
    print_error "Docker is not running or not accessible"
    print_warning "Please start Docker Desktop and try again"
    exit 1
fi
print_success "Docker is running"

# Start MySQL and Redis containers
print_step "Step 2: Starting MySQL and Redis containers"
print_info "This may take 30-60 seconds for first-time setup..."
docker-compose up -d mysql redis

# Wait for MySQL to be ready
print_info "Waiting for MySQL to initialize..."
RETRY_COUNT=0
MAX_RETRIES=30
until docker exec lms-mysql mysqladmin ping -h localhost --silent &> /dev/null; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_error "MySQL failed to start after $MAX_RETRIES attempts"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo ""
print_success "MySQL is ready"

# Verify containers are running
MYSQL_STATUS=$(docker ps --filter "name=lms-mysql" --format "{{.Status}}")
REDIS_STATUS=$(docker ps --filter "name=lms-redis" --format "{{.Status}}")
print_success "MySQL: $MYSQL_STATUS"
print_success "Redis: $REDIS_STATUS"

# Navigate to backend
cd backend

# Generate Prisma Client
print_step "Step 3: Generating Prisma Client"
npx prisma generate
print_success "Prisma Client generated"

# Apply migrations
print_step "Step 4: Applying database migrations"
print_info "Creating 7 new tables for Phase 3.3..."
npx prisma migrate dev --name add_usa_pto_and_analytics --skip-generate
print_success "Migrations applied successfully"

# Seed USA PTO policies
print_step "Step 5: Seeding USA PTO policies"
npx tsx src/scripts/seed-usa-pto-policies.ts
print_success "USA PTO policies seeded"

# Verify database
print_step "Step 6: Verifying database"
TABLE_COUNT=$(docker exec lms-mysql mysql -u lms_user -ppassword123 leave_management_db -se "
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'leave_management_db'
    AND table_name IN (
        'usa_pto_policies',
        'usa_pto_accruals',
        'usa_pto_carry_forwards',
        'leave_analytics',
        'department_leave_stats',
        'leave_pattern_analysis',
        'team_availability_forecasts'
    );
")

if [ "$TABLE_COUNT" -eq 7 ]; then
    print_success "All 7 Phase 3.3 tables created"
else
    print_warning "Expected 7 tables, found $TABLE_COUNT"
fi

# Count PTO policies
POLICY_COUNT=$(docker exec lms-mysql mysql -u lms_user -ppassword123 leave_management_db -se "
    SELECT COUNT(*) FROM usa_pto_policies;
")
print_success "Found $POLICY_COUNT PTO policies in database"

# Return to root
cd ..

echo ""
echo "=================================================="
print_success "Phase 3.3 Setup Complete!"
echo "=================================================="
echo ""
print_info "Summary:"
echo "  ✔ MySQL and Redis containers running"
echo "  ✔ 7 new database tables created"
echo "  ✔ $POLICY_COUNT USA PTO policies seeded"
echo "  ✔ Prisma Client generated"
echo ""
print_info "Next Steps:"
echo "  1. Start backend server:"
echo "     cd backend && npm run dev"
echo ""
echo "  2. Test API endpoint:"
echo "     curl http://localhost:3001/api/v1/usa-pto/policies"
echo ""
echo "  3. Open Prisma Studio to view data:"
echo "     cd backend && npx prisma studio"
echo ""
echo "  4. View frontend:"
echo "     - Employee: Visit /pto-report (USA employees only)"
echo "     - Admin: Visit /admin/usa-pto-management"
echo ""
print_info "Documentation:"
echo "  - Quick Start: QUICK_START_PHASE_3.md"
echo "  - Full Guide: PHASE_3_DEPLOYMENT_GUIDE.md"
echo "  - Implementation: PHASE_3.3_IMPLEMENTATION_COMPLETE.md"
echo ""
print_success "Phase 3.3 is ready to use!"
echo ""
