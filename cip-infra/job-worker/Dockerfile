FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache wget
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force
COPY src/ ./src/
RUN addgroup -S cip && adduser -S cip -G cip
USER cip
EXPOSE 3002
CMD ["node", "src/index.js"]
