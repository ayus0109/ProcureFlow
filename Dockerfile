# Stage 1: Build the React Frontend
FROM node:24-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Server Environment
FROM node:24-slim
WORKDIR /app

# Copy backend package and install production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Seed initial APMC demonstration data
RUN cd backend && node db/seed.js

ENV NODE_ENV=production
EXPOSE 4000

# Start unified server
CMD ["node", "backend/server.js"]
