# ============================================
# Stage 1: Backend Build
# ============================================
FROM node:22-alpine AS backend-build

WORKDIR /app/backend

# Copy backend files
COPY backend/package*.json ./
RUN npm install

# Copy backend source
COPY backend/src ./src
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./

# Build backend
RUN npm run build

# ============================================
# Stage 2: Frontend Build
# ============================================
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./
RUN npm install

# Set VITE_API_URL at build time so frontend calls /api (via nginx proxy)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Copy frontend source
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/tsconfig*.json ./
COPY frontend/vite.config.ts ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

# Build frontend
RUN npm run build

# ============================================
# Stage 3: Backend Runtime
# ============================================
FROM node:22-alpine AS backend-runtime

WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy backend build
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma

# Expose port
EXPOSE 5000

# Default command
CMD ["node", "dist/src/server.js"]

# ============================================
# Stage 4: Frontend Runtime (Nginx with API Proxy)
# ============================================
FROM nginx:stable-alpine AS frontend-runtime

# Copy frontend build to nginx
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]