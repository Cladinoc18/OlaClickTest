# Dockerfile

# ---- Base Stage ----
    FROM node:18-alpine AS base
    WORKDIR /usr/src/app
    COPY package*.json ./
    RUN npm install --only=production --legacy-peer-deps
    
    # ---- Development Stage ----
    FROM base AS development
    ENV NODE_ENV=development
    RUN npm install --legacy-peer-deps
    COPY . .
    # TypeScript compilation will be handled by `npm run start:dev` which uses nodemon and ts-node
    
    # ---- Build Stage ----
    FROM base AS builder
    ENV NODE_ENV=production
    # Install all dependencies, including devDependencies, to build the project
    RUN npm install --legacy-peer-deps
    COPY . .
    RUN npm run build
    
    # ---- Production Stage ----
    FROM node:18-alpine AS production
    ENV NODE_ENV=production
    WORKDIR /usr/src/app
    COPY --from=builder /usr/src/app/dist ./dist
    COPY --from=builder /usr/src/app/node_modules ./node_modules
    # If you have other assets that need to be copied from the builder stage, add them here
    # e.g. COPY --from=builder /usr/src/app/public ./public
    
    EXPOSE 3000
    CMD ["node", "dist/main.js"]