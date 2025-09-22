#!/bin/bash

# Leave Management System Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]
# Example: ./scripts/deploy.sh production v1.2.0

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

# Validate environment
validate_environment() {
    log "Validating environment: $ENVIRONMENT"

    case $ENVIRONMENT in
        development|staging|production)
            log "Environment '$ENVIRONMENT' is valid"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Must be development, staging, or production"
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if required commands exist
    local required_commands=("docker" "docker-compose" "git" "node" "npm")

    for cmd in "${required_commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            error "$cmd is required but not installed"
        fi
    done

    # Check Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running"
    fi

    success "All prerequisites met"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."

    local backup_dir="backups/${ENVIRONMENT}_${TIMESTAMP}"
    mkdir -p "$backup_dir"

    # Backup environment file
    if [ -f ".env" ]; then
        cp .env "$backup_dir/.env.backup"
    fi

    # Backup database
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Creating database backup..."
        docker-compose exec -T mysql mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} > "$backup_dir/database_backup.sql"
    fi

    # Backup uploaded files
    if [ -d "uploads" ]; then
        tar -czf "$backup_dir/uploads_backup.tar.gz" uploads/
    fi

    success "Backup created in $backup_dir"
}

# Build application
build_application() {
    log "Building application..."

    # Install dependencies
    log "Installing backend dependencies..."
    cd backend && npm ci --production

    log "Installing frontend dependencies..."
    cd ../frontend && npm ci

    # Build frontend
    log "Building frontend..."
    npm run build

    # Build backend
    log "Building backend..."
    cd ../backend && npm run build

    cd "$PROJECT_ROOT"
    success "Application built successfully"
}

# Run tests
run_tests() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Running test suite before production deployment..."

        # Backend tests
        cd backend
        npm run test
        npm run test:integration

        # Frontend tests
        cd ../frontend
        npm run test

        cd "$PROJECT_ROOT"
        success "All tests passed"
    else
        log "Skipping tests for $ENVIRONMENT environment"
    fi
}

# Deploy with Docker Compose
deploy_docker() {
    log "Deploying with Docker Compose..."

    # Set environment-specific configuration
    case $ENVIRONMENT in
        development)
            export COMPOSE_FILE="docker-compose.yml"
            ;;
        staging)
            export COMPOSE_FILE="docker-compose.yml:docker-compose.staging.yml"
            ;;
        production)
            export COMPOSE_FILE="docker-compose.yml:docker-compose.production.yml"
            ;;
    esac

    # Pull latest images
    log "Pulling latest images..."
    docker-compose pull

    # Stop existing services
    log "Stopping existing services..."
    docker-compose down

    # Start services
    log "Starting services..."
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose --profile nginx --profile monitoring up -d
    else
        docker-compose up -d
    fi

    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30

    # Check health
    check_deployment_health

    success "Docker deployment completed"
}

# Deploy to cloud (AWS ECS)
deploy_aws() {
    log "Deploying to AWS ECS..."

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is required for AWS deployment"
    fi

    # Build and push images
    log "Building and pushing Docker images..."

    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION=${AWS_REGION:-us-west-2}
    ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

    # Build and push backend
    docker build -t lms-backend:$VERSION ./backend
    docker tag lms-backend:$VERSION $ECR_REGISTRY/lms-backend:$VERSION
    docker push $ECR_REGISTRY/lms-backend:$VERSION

    # Build and push frontend
    docker build -t lms-frontend:$VERSION ./frontend
    docker tag lms-frontend:$VERSION $ECR_REGISTRY/lms-frontend:$VERSION
    docker push $ECR_REGISTRY/lms-frontend:$VERSION

    # Update ECS services
    log "Updating ECS services..."

    aws ecs update-service \
        --cluster lms-${ENVIRONMENT} \
        --service lms-backend-${ENVIRONMENT} \
        --force-new-deployment

    aws ecs update-service \
        --cluster lms-${ENVIRONMENT} \
        --service lms-frontend-${ENVIRONMENT} \
        --force-new-deployment

    # Wait for deployment to stabilize
    log "Waiting for deployment to stabilize..."
    aws ecs wait services-stable \
        --cluster lms-${ENVIRONMENT} \
        --services lms-backend-${ENVIRONMENT} lms-frontend-${ENVIRONMENT}

    success "AWS ECS deployment completed"
}

# Check deployment health
check_deployment_health() {
    log "Checking deployment health..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts"

        # Check backend health
        if curl -f -s http://localhost:3001/health > /dev/null; then
            log "Backend is healthy"
            break
        fi

        if [ $attempt -eq $max_attempts ]; then
            error "Health check failed after $max_attempts attempts"
        fi

        sleep 10
        ((attempt++))
    done

    # Check frontend
    if curl -f -s http://localhost:8080 > /dev/null; then
        log "Frontend is accessible"
    else
        warn "Frontend health check failed"
    fi

    success "Deployment health check passed"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."

    if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
        docker-compose exec backend npx prisma migrate deploy
    else
        cd backend && npx prisma migrate deploy && cd "$PROJECT_ROOT"
    fi

    success "Database migrations completed"
}

# Setup monitoring
setup_monitoring() {
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
        log "Setting up monitoring..."

        # Start monitoring stack
        docker-compose --profile monitoring up -d

        # Wait for services
        sleep 30

        # Check Prometheus
        if curl -f -s http://localhost:9090/-/healthy > /dev/null; then
            log "Prometheus is running"
        else
            warn "Prometheus health check failed"
        fi

        # Check Grafana
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            log "Grafana is running"
        else
            warn "Grafana health check failed"
        fi

        success "Monitoring setup completed"
    fi
}

# Send deployment notification
send_notification() {
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        log "Sending deployment notification..."

        local status=${1:-success}
        local message="🚀 LMS deployment to $ENVIRONMENT completed successfully! Version: $VERSION"

        if [ "$status" = "failure" ]; then
            message="❌ LMS deployment to $ENVIRONMENT failed! Version: $VERSION"
        fi

        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            $SLACK_WEBHOOK_URL
    fi
}

# Rollback deployment
rollback() {
    error_msg=$1
    error "Deployment failed: $error_msg"

    log "Initiating rollback..."

    # Restore from backup
    local latest_backup=$(ls -t backups/ | head -n 1)
    if [ -n "$latest_backup" ]; then
        log "Restoring from backup: $latest_backup"

        # Restore environment file
        if [ -f "backups/$latest_backup/.env.backup" ]; then
            cp "backups/$latest_backup/.env.backup" .env
        fi

        # Restore database if production
        if [ "$ENVIRONMENT" = "production" ] && [ -f "backups/$latest_backup/database_backup.sql" ]; then
            docker-compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} < "backups/$latest_backup/database_backup.sql"
        fi

        # Restart services
        docker-compose restart
    fi

    send_notification "failure"
    exit 1
}

# Main deployment function
main() {
    log "Starting deployment to $ENVIRONMENT (version: $VERSION)"

    # Change to project root
    cd "$PROJECT_ROOT"

    # Set error handler
    trap 'rollback "Unexpected error occurred"' ERR

    # Deployment steps
    validate_environment
    check_prerequisites

    # Load environment variables
    if [ -f ".env.$ENVIRONMENT" ]; then
        log "Loading environment configuration from .env.$ENVIRONMENT"
        source ".env.$ENVIRONMENT"
    elif [ -f ".env" ]; then
        log "Loading environment configuration from .env"
        source ".env"
    else
        warn "No environment configuration found"
    fi

    # Determine deployment type
    DEPLOYMENT_TYPE=${DEPLOYMENT_TYPE:-docker}

    case $DEPLOYMENT_TYPE in
        docker)
            backup_current
            build_application
            run_tests
            deploy_docker
            ;;
        aws)
            backup_current
            build_application
            run_tests
            deploy_aws
            ;;
        *)
            error "Unknown deployment type: $DEPLOYMENT_TYPE"
            ;;
    esac

    run_migrations
    setup_monitoring
    send_notification "success"

    success "Deployment to $ENVIRONMENT completed successfully!"

    # Display access information
    log "Application URLs:"
    case $ENVIRONMENT in
        development)
            log "  Frontend: http://localhost:5173"
            log "  Backend: http://localhost:3001"
            ;;
        staging)
            log "  Application: https://staging.your-domain.com"
            log "  Monitoring: https://monitoring-staging.your-domain.com"
            ;;
        production)
            log "  Application: https://your-domain.com"
            log "  Monitoring: https://monitoring.your-domain.com"
            ;;
    esac
}

# Help function
show_help() {
    cat << EOF
Leave Management System Deployment Script

Usage: $0 [environment] [version] [options]

Environments:
  development  - Local development deployment
  staging      - Staging environment deployment
  production   - Production environment deployment

Options:
  -h, --help          Show this help message
  -t, --type TYPE     Deployment type (docker, aws)
  -v, --version VER   Version to deploy (default: latest)

Examples:
  $0 staging v1.2.0
  $0 production latest --type aws
  $0 development

Environment Variables:
  DEPLOYMENT_TYPE     - Deployment type (docker, aws)
  SLACK_WEBHOOK_URL   - Slack webhook for notifications
  AWS_REGION          - AWS region for ECS deployment

EOF
}

# Parse command line arguments
case ${1:-} in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac