# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package and prisma files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy application code and build
COPY . .
RUN npm run build
RUN npx prisma generate

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package and prisma files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev
RUN npx prisma generate

# Copy built code from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Run migrations automatically, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
