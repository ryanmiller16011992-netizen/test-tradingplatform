FROM node:18-alpine

WORKDIR /app

# Copy package & config files from backend folder
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./

# Install dependencies
RUN npm install

# Copy backend source code
COPY backend .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Expose port (Railway injects PORT)
EXPOSE 3001

# Start app
CMD ["node", "dist/main.js"]