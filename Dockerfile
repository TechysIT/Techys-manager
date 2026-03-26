# 1. Use Node 22 LTS
FROM node:22-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json & lock first (caches npm install)
COPY package.json package-lock.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy rest of app
COPY . .

# 6. Generate Prisma client
RUN npx prisma generate

# 7. Build Next.js
RUN npm run build

# 8. Expose port
EXPOSE 3000

# 9. Start app
CMD ["npm", "run", "start"]