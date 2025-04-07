FROM node:16-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY dist/ ./dist/
COPY docs/ ./docs/

# Create config directory
RUN mkdir -p config logs

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Set user to node for security
USER node

# Start the server
CMD ["node", "dist/server.js"]
