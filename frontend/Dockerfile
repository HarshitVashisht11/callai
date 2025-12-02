FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --silent

# Copy source and build
COPY frontend/ .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# Copy built Next.js app from builder
COPY --from=builder /app/ .

ENV NODE_ENV=production
EXPOSE 3000

# Use Next's built-in production server
CMD ["npm", "run", "start"]
