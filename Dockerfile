# 1. Use Node 22 LTS
FROM node:22-alpine

WORKDIR /app

# Copy everything first
COPY . .

# Install dependencies & generate Prisma client
RUN npm install

# Build Next.js
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]