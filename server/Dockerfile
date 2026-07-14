FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy local code
COPY . .

ENV PORT=5001
EXPOSE 5001

CMD ["node", "index.js"]
