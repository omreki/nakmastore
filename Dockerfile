# Step 1: Build the React application
FROM node:18-alpine AS client-build

WORKDIR /app/client

# Copy frontend package files
COPY client/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy frontend source files
COPY client/ ./

# Pass build environment variables (required for Vite build)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_ADMIN_EMAILS

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_ADMIN_EMAILS=$VITE_ADMIN_EMAILS

# Build the client React application
RUN npm run build

# Step 2: Set up the production Node/Express server
FROM node:18-alpine

WORKDIR /app

# Copy server package files and install production dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy server application files
COPY server/ ./server/

# Copy built frontend assets from Step 1
COPY --from=client-build /app/client/dist ./client/dist

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001

WORKDIR /app/server
CMD ["node", "index.js"]
