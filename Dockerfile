# ---------- 1. Builder Stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy prisma schema first (IMPORTANT)
COPY prisma ./prisma

# Generate Prisma client (fix enums issue)
RUN npx prisma generate

# Copy rest of the app
COPY . .

# Build Next.js app
RUN npm run build


# ---------- 2. Runner Stage ----------
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy only needed files
COPY package.json package-lock.json ./

# Install only production deps
RUN npm install --omit=dev

# Copy built app + prisma + node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start app (with migrations)
CMD sh -c "npx prisma migrate deploy && npm start"