# 1. Use official Node.js Alpine image
FROM node:22-alpine AS builder

# 2. Set working directory
WORKDIR /app

# 3. Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# 4. Copy rest of the app
COPY . .

# 5. Build Next.js app
RUN npm run build

# 6. Install only production dependencies for smaller image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package.json + package-lock.json
COPY package.json package-lock.json ./

RUN npm install --production

# Copy built files + prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Expose port 3000
EXPOSE 3000

# Run Prisma migrations at startup (optional but recommended)
CMD npx prisma migrate deploy && npm start