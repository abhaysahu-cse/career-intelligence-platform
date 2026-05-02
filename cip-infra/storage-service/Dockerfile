FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache wget
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force
COPY src/ ./src/
RUN mkdir -p /data/resumes /data/assets && chown -R node:node /data
USER node
EXPOSE 3003
CMD ["node", "src/index.js"]
