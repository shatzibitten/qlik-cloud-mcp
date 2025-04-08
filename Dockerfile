FROM node:16-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:16-alpine

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create directories for configuration and data
RUN mkdir -p config data
RUN chown -R appuser:appgroup config data

# Set volumes for persistent data
VOLUME ["/app/config", "/app/data"]

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -q -O - http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/server.js"]
