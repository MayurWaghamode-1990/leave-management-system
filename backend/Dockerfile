# Multi-stage build for Node.js backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install curl for healthchecks
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S lms -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=lms:nodejs /app/dist ./dist
COPY --from=builder --chown=lms:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=lms:nodejs /app/prisma ./prisma
COPY --from=builder --chown=lms:nodejs /app/src/templates ./src/templates

# Create uploads directory
RUN mkdir -p uploads && chown lms:nodejs uploads

# Copy startup script
COPY --chown=lms:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER lms

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the application
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]