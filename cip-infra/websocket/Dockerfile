FROM node:20-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy package files and install deps
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy source
COPY src/ ./src/

# Non-root user
RUN addgroup -S cip && adduser -S cip -G cip
USER cip

EXPOSE 3001

CMD ["node", "src/index.js"]
